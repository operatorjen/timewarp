import test from 'node:test'
import assert from 'node:assert/strict'
import { Timewarp } from './index.mjs'

function banner(msg) {
  const line = '='.repeat(msg.length)
  console.log(`\n${msg}\n${line}`)
}

test('TIMEWARP', async () => {
  banner('INTEGRATION TEST')
  const tw = new Timewarp({
    tau: 1.0,
    minScale: 0.2
  })
  const s0 = tw.update({
    loopGain: 0,
    coupling: 0,
    predictionError: 1,
    novelty: 0.5,
    activation: 0.5
  })
  console.log('timewarp: baseline state', {
    loopGain: 0,
    coupling: 0,
    predictionError: 1,
    novelty: 0.5,
    activation: 0.5,
    absorption: s0.absorption,
    timelessness: s0.timelessness,
    subjectiveDtScale: s0.subjectiveDtScale
  })
  assert.ok(s0.absorption <= 0.2)
  assert.ok(s0.timelessness <= 0.2)
  assert.ok(s0.subjectiveDtScale >= 0.8)

  const s1 = tw.update({
    loopGain: 0.9,
    coupling: 0.9,
    predictionError: 0.1,
    novelty: 0.5,
    activation: 0.5
  })
  console.log('timewarp: high loopGain and coupling, low error', {
    loopGain: 0.9,
    coupling: 0.9,
    predictionError: 0.1,
    novelty: 0.5,
    activation: 0.5,
    absorption: s1.absorption,
    timelessness: s1.timelessness,
    subjectiveDtScale: s1.subjectiveDtScale
  })
  assert.ok(s1.absorption > s0.absorption)
  assert.ok(s1.timelessness > s0.timelessness)
  assert.ok(s1.subjectiveDtScale < s0.subjectiveDtScale)

  const s2 = tw.update({
    loopGain: 0.9,
    coupling: 0.9,
    predictionError: 0.05,
    novelty: 0.5,
    activation: 0.5
  })
  console.log('timewarp: sustained strong loop', {
    loopGain: 0.9,
    coupling: 0.9,
    predictionError: 0.05,
    absorption: s2.absorption,
    timelessness: s2.timelessness,
    subjectiveDtScale: s2.subjectiveDtScale
  })
  assert.ok(s2.timelessness >= s1.timelessness)

  const s3 = tw.update({
    loopGain: 0.9,
    coupling: 0.9,
    predictionError: 1.0,
    novelty: 0.5,
    activation: 0.5
  })
  console.log('timewarp: high prediction error (friction injected)', {
    loopGain: 0.9,
    coupling: 0.9,
    predictionError: 1.0,
    absorption: s3.absorption,
    timelessness: s3.timelessness,
    subjectiveDtScale: s3.subjectiveDtScale
  })
  assert.ok(s3.absorption < s2.absorption)
  assert.ok(s3.timelessness < s2.timelessness)
  assert.ok(s3.subjectiveDtScale > s2.subjectiveDtScale)
})