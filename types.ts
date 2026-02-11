
export enum SourceType {
  DC_MAGNET = 'DC_MAGNET',
  AC_COIL = 'AC_COIL'
}

export interface PhysicsState {
  magnetX: number; // -100 to 100
  magnetY: number; // -50 to 50
  magnetVelocity: number;
  fieldStrength: number;
  isReversed: boolean; // New: tracks magnet polarity
  turns: number;
  isPaused: boolean;
  sourceType: SourceType;
  acFrequency: number;
  currentTime: number;
}

export interface CalculatedData {
  flux: number;
  dFluxDt: number;
  emf: number;
  currentDirection: number; // -1, 0, 1
}

export interface HistoryPoint {
  time: number;
  emf: number;
  flux: number;
}
