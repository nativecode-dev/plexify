export interface HandbrakeProgress {
  taskNumber: number
  taskCount: number
  percentComplete: number
  fps: number
  avgFps: number
  eta: string
  task: string
}
