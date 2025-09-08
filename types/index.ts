export type PredictionShowResponse = {
  status: "ok"
  data: {
    prediction_log: {
      id: number
      drawing_id: number
      job_id: number
      status: string
      answer: number | null
    }
  }
}

export type PendingItem = {
  key: string
  drawingId: number
  predictionId: number
}