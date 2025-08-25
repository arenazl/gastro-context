from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class TableBase(BaseModel):
    number: int = Field(gt=0)
    capacity: int = Field(gt=0, le=20)
    location: str

class TableCreate(TableBase):
    pass

class TableUpdate(BaseModel):
    capacity: Optional[int] = Field(None, gt=0, le=20)
    location: Optional[str] = None
    status: Optional[str] = None

class TableStatusUpdate(BaseModel):
    status: str

class TableResponse(TableBase):
    id: int
    status: str
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True