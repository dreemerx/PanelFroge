"""版本管理 API 路由，提供制品版本查询、回滚和版本对比功能。"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import SessionDep, WsManagerDep
from app.models.project import Character, Shot
from app.schemas.project import CharacterRead, ShotRead
from app.schemas.version import (
    ArtifactVersionRead,
    RollbackRequest,
    RollbackResponse,
    VersionCompareRead,
    VersionDiff,
    VersionListRead,
)
from app.services.version_service import EntityType, VersionService
from app.ws.manager import ConnectionManager

router = APIRouter()
version_service = VersionService()


def _diff_snapshots(old: dict, new: dict) -> list[VersionDiff]:
    """对比两个快照字典，返回有差异的字段列表。"""
    fields = sorted(set(old.keys()) | set(new.keys()))
    return [
        VersionDiff(field_name=field, old_value=old.get(field), new_value=new.get(field))
        for field in fields
        if old.get(field) != new.get(field)
    ]


@router.get("/projects/{project_id}/versions", response_model=VersionListRead)
async def list_versions(
    project_id: int,
    entity_type: EntityType = Query(...),
    entity_id: int = Query(...),
    session: AsyncSession = SessionDep,
) -> VersionListRead:
    """列出指定实体的所有版本记录。"""
    versions = await version_service.get_versions(session, entity_type, entity_id)
    versions = [version for version in versions if version.project_id == project_id]
    return VersionListRead(entity_type=entity_type, entity_id=entity_id, versions=versions)


@router.get("/versions/{version_id}", response_model=ArtifactVersionRead)
async def get_version(version_id: int, session: AsyncSession = SessionDep) -> ArtifactVersionRead:
    """根据版本 ID 获取单个版本详情。"""
    version = await version_service.get_version(session, version_id)
    if version is None:
        raise HTTPException(status_code=404, detail="Version not found")
    return ArtifactVersionRead.model_validate(version)


@router.post("/versions/rollback", response_model=RollbackResponse)
async def rollback_version(
    payload: RollbackRequest,
    session: AsyncSession = SessionDep,
    ws: ConnectionManager = WsManagerDep,
) -> RollbackResponse:
    """回滚实体到指定版本，并通过 WebSocket 通知前端。"""
    current_versions = await version_service.get_versions(
        session, payload.entity_type, payload.entity_id
    )
    from_version = current_versions[0].version if current_versions else 0
    new_version = await version_service.rollback(
        session, payload.entity_type, payload.entity_id, payload.target_version
    )
    await session.commit()
    await session.refresh(new_version)

    if payload.entity_type == "character":
        entity = await session.get(Character, payload.entity_id)
        if entity is not None:
            await ws.send_event(
                entity.project_id,
                {
                    "type": "character_updated",
                    "data": {"character": CharacterRead.model_validate(entity).model_dump(mode="json")},
                },
            )
    else:
        entity = await session.get(Shot, payload.entity_id)
        if entity is not None:
            await ws.send_event(
                entity.project_id,
                {
                    "type": "shot_updated",
                    "data": {"shot": ShotRead.model_validate(entity).model_dump(mode="json")},
                },
            )

    await ws.send_event(
        new_version.project_id,
        {
            "type": "version_rollback",
            "data": {
                "entity_type": payload.entity_type,
                "entity_id": payload.entity_id,
                "from_version": from_version,
                "to_version": payload.target_version,
            },
        },
    )
    await ws.send_event(
        new_version.project_id,
        {
            "type": "version_created",
            "data": {
                "entity_type": payload.entity_type,
                "entity_id": payload.entity_id,
                "version": new_version.version,
                "trigger": new_version.trigger,
            },
        },
    )

    return RollbackResponse(
        success=True,
        message=f"已回滚到版本 {payload.target_version}",
        new_version=ArtifactVersionRead.model_validate(new_version),
    )


@router.get("/projects/{project_id}/versions/compare", response_model=VersionCompareRead)
async def compare_versions(
    project_id: int,
    entity_type: EntityType = Query(...),
    entity_id: int = Query(...),
    v1: int = Query(..., ge=1),
    v2: int = Query(..., ge=1),
    session: AsyncSession = SessionDep,
) -> VersionCompareRead:
    """对比同一实体的两个版本，返回字段级差异。"""
    from_version = await version_service.get_version_by_number(session, entity_type, entity_id, v1)
    to_version = await version_service.get_version_by_number(session, entity_type, entity_id, v2)
    if from_version is None or to_version is None:
        raise HTTPException(status_code=404, detail="Version not found")
    if from_version.project_id != project_id or to_version.project_id != project_id:
        raise HTTPException(status_code=404, detail="Version not found")

    return VersionCompareRead(
        entity_type=entity_type,
        entity_id=entity_id,
        from_version=ArtifactVersionRead.model_validate(from_version),
        to_version=ArtifactVersionRead.model_validate(to_version),
        diffs=_diff_snapshots(from_version.snapshot, to_version.snapshot),
    )
