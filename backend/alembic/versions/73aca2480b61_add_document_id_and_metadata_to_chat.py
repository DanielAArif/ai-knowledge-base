"""add document_id and metadata to chat

Revision ID: xxxx_id_otomatis
Revises: revision_sebelumnya
Create Date: 2026-08-18

"""
from alembic import op
import sqlalchemy as sqla
from sqlalchemy.dialects import postgresql

revision: str = '73aca2480b61'
down_revision: str = 'e0b85badd0f7'
branch_labels = None
depends_on = None


def upgrade():
    # 1. Tambah kolom document_id & updated_at di chat_sessions
    op.add_column('chat_sessions', sqla.Column('document_id', sqla.Integer(), nullable=True))
    op.add_column('chat_sessions', sqla.Column('updated_at', sqla.DateTime(), server_default=sqla.text('now()'), nullable=True))
    
    # Tambah Foreign Key ke tabel documents
    op.create_foreign_key(
        'fk_chat_sessions_document_id',
        'chat_sessions', 'documents',
        ['document_id'], ['id'],
        ondelete='SET NULL'
    )

    # 2. Ubah nama sender menjadi role & tambah metadata di chat_messages
    op.alter_column('chat_messages', 'sender', new_column_name='role')
    
    # PERBAIKAN DI SINI: Hapus argumen astext_metadata=True
    op.add_column('chat_messages', sqla.Column('metadata', postgresql.JSONB(), nullable=True))


def downgrade():
    # Rollback perubahan
    op.drop_column('chat_messages', 'metadata')
    op.alter_column('chat_messages', 'role', new_column_name='sender')
    
    op.drop_constraint('fk_chat_sessions_document_id', 'chat_sessions', type_='foreignkey')
    op.drop_column('chat_sessions', 'updated_at')
    op.drop_column('chat_sessions', 'document_id')