import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..db.base import Base


class Store(Base):
    __tablename__ = "stores"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id: Mapped[str] = mapped_column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    address: Mapped[str | None] = mapped_column(String(255), nullable=True)
    type: Mapped[str] = mapped_column(String(20), default="restaurant")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    organization: Mapped["Organization"] = relationship("Organization", back_populates="stores", foreign_keys=[organization_id])
    store_members: Mapped[list["StoreMember"]] = relationship("StoreMember", back_populates="store")
    items: Mapped[list["Item"]] = relationship("Item", back_populates="store")
    stock_logs: Mapped[list["StockLog"]] = relationship("StockLog", back_populates="store")
    disposal_records: Mapped[list["DisposalRecord"]] = relationship("DisposalRecord", back_populates="store")
    storage_locations: Mapped[list["StorageLocation"]] = relationship("StorageLocation", back_populates="store")
    hygiene_sessions: Mapped[list["HygieneCheckSession"]] = relationship("HygieneCheckSession", back_populates="store")
