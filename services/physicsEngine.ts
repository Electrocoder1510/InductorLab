
import { PhysicsState, CalculatedData, SourceType } from '../types';

const COIL_CENTER_X = 0;
const COIL_RADIUS = 20;

/**
 * Simplified model for Magnetic Flux through a coil.
 * Phi = B * A * N
 */
export const calculatePhysics = (state: PhysicsState, dt: number): CalculatedData => {
  const { magnetX, magnetY = 0, magnetVelocity, fieldStrength, isReversed, turns, sourceType, acFrequency, currentTime } = state;
  
  // Effective field strength flips with polarity
  const effectiveB0 = isReversed ? -fieldStrength : fieldStrength;
  
  // Area of the coil (simplified scale)
  const Area = Math.PI * Math.pow(COIL_RADIUS / 10, 2);
  
  const sigma = 30;
  const radialSigma = 15;
  const radialFactor = 1 / (1 + Math.pow(magnetY / radialSigma, 2));

  const getB = (x: number) => {
    const dist = x - COIL_CENTER_X;
    return effectiveB0 * Math.pow(1 + Math.pow(dist / sigma, 2), -1.5) * radialFactor;
  };

  const getDBDx = (x: number) => {
    const dist = x - COIL_CENTER_X;
    return -1.5 * effectiveB0 * Math.pow(1 + Math.pow(dist / sigma, 2), -2.5) * (2 * dist / Math.pow(sigma, 2)) * radialFactor;
  };

  let flux = 0;
  let dFluxDt = 0;

  if (sourceType === SourceType.DC_MAGNET) {
    flux = getB(magnetX) * Area * turns;
    const dPhiDx = turns * Area * getDBDx(magnetX);
    dFluxDt = dPhiDx * magnetVelocity;
  } else {
    const omega = 2 * Math.PI * acFrequency;
    const spatialFactor = getB(magnetX); 
    flux = spatialFactor * Area * turns * Math.sin(omega * currentTime);
    dFluxDt = spatialFactor * Area * turns * omega * Math.cos(omega * currentTime);
  }

  const emf = -dFluxDt;

  return {
    flux,
    dFluxDt,
    emf,
    currentDirection: Math.abs(emf) < 0.01 ? 0 : Math.sign(emf)
  };
};
