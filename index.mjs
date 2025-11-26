const DEFAULT_PARAMS = {
  wGain: 0.35,
  wCoupling: 0.35,
  wSmoothness: 0.15,
  wNovelty: 0.10,
  wActivation: 0.05,
  noveltyCenter: 0.5,
  noveltyWidth: 0.25,
  activationCenter: 0.5,
  activationWidth: 0.25,
  tau: 0.25,
  minScale: 0.2,
  floorAbsorption: 0,
  floorTimelessness: 0
}
const CLAMP_MIN = 0
const CLAMP_MAX = 1
const GAUSSIAN_MIN_WIDTH = 1e-6
const GAUSSIAN_HALF = 0.5
const SUBJECTIVE_BASE_SCALE = 1.0
const DEFAULT_LOOP_GAIN = 0
const DEFAULT_COUPLING = 0
const DEFAULT_PREDICTION_ERROR = 1
const DEFAULT_NOVELTY = 0.5
const DEFAULT_ACTIVATION = 0.5

function clamp01(x) { return x < CLAMP_MIN ? CLAMP_MIN : x > CLAMP_MAX ? CLAMP_MAX : x }

function ema(prev, next, tau) { return (1 - tau) * prev + tau * next }

function gaussianWindow(x, center, width) {
  const w = Math.max(width, GAUSSIAN_MIN_WIDTH)
  const z = (x - center) / w
  return Math.exp(-GAUSSIAN_HALF * z * z)
}

function lerp(a, b, t) { return a + (b - a) * t }

export class Timewarp {
  constructor(params = {}) {
    this.params = { ...DEFAULT_PARAMS, ...params }
    this.reset()
  }

  reset() {
    this.absorption = this.params.floorAbsorption
    this.timelessness = this.params.floorTimelessness
    this.subjectiveDtScale = SUBJECTIVE_BASE_SCALE
    this.last = {
      loopGain: DEFAULT_LOOP_GAIN,
      coupling: DEFAULT_COUPLING,
      predictionError: DEFAULT_PREDICTION_ERROR,
      novelty: DEFAULT_NOVELTY,
      activation: DEFAULT_ACTIVATION,
      smoothness: CLAMP_MIN
    }
  }

  update(input = {}) {
    const {
      loopGain = DEFAULT_LOOP_GAIN,
      coupling = DEFAULT_COUPLING,
      predictionError = DEFAULT_PREDICTION_ERROR,
      novelty = DEFAULT_NOVELTY,
      activation = DEFAULT_ACTIVATION
    } = input
    const p = this.params
    const g = clamp01(loopGain)
    const c = clamp01(coupling)
    const eps = clamp01(predictionError)
    const n = clamp01(novelty)
    const a = clamp01(activation)
    const smoothness = 1 - eps
    const nWin = gaussianWindow(n, p.noveltyCenter, p.noveltyWidth)
    const aWin = gaussianWindow(a, p.activationCenter, p.activationWidth)
    let absorptionRaw = p.wGain * g + p.wCoupling * c + p.wSmoothness * smoothness + p.wNovelty * nWin + p.wActivation * aWin
    absorptionRaw = clamp01(absorptionRaw)
    this.absorption = ema(this.absorption, absorptionRaw, p.tau)
    this.timelessness = ema(this.timelessness, this.absorption, p.tau)
    this.timelessness = clamp01(this.timelessness)
    this.subjectiveDtScale = lerp(SUBJECTIVE_BASE_SCALE, p.minScale, this.timelessness)
    this.last = {
      loopGain: g,
      coupling: c,
      predictionError: eps,
      novelty: n,
      activation: a,
      smoothness
    }
    return this.get()
  }

  get() {
    return {
      absorption: this.absorption,
      timelessness: this.timelessness,
      subjectiveDtScale: this.subjectiveDtScale,
      last: { ...this.last }
    }
  }

  exportState() {
    return {
      params: { ...this.params },
      absorption: this.absorption,
      timelessness: this.timelessness,
      subjectiveDtScale: this.subjectiveDtScale,
      last: { ...this.last }
    }
  }

  importState(state = {}) {
    if (state.params) this.params = { ...this.params, ...state.params }
    if (typeof state.absorption === 'number') this.absorption = clamp01(state.absorption)
    if (typeof state.timelessness === 'number') this.timelessness = clamp01(state.timelessness)
    if (typeof state.subjectiveDtScale === 'number') this.subjectiveDtScale = state.subjectiveDtScale
    if (state.last) this.last = { ...this.last, ...state.last }
  }
}

export default Timewarp