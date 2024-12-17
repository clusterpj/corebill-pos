// src/types/sync.ts
export interface SyncOperation {
    id: string
    type: 'create' | 'update' | 'delete'
    entity: string
    data: any
    timestamp: string
    status: 'pending' | 'completed' | 'failed'
    retries?: number
    error?: string
  }
  
  export interface SyncStatus {
    lastSync: string
    pending: number
    failed: number
    operations: SyncOperation[]
  }
  