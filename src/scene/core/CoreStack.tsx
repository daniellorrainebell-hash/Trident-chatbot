import { useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { SERVICES } from '../../config/brand'
import { useExperience } from '../../state/useExperience'
import { LAYER_Y, WAFER_SIZE } from '../layout'
import { Wafer } from './Wafer'
import { Die } from './Die'
import { Packet } from '../flow/Packet'
import { ViaBeams } from './ViaBeams'

/**
 * The Living Intelligence Core: a stack of glass circuit wafers around a
 * central die.
 *
 * The whole object turns as one slow unit. There is deliberately nothing
 * orbiting it, nothing connecting it to anything, and nothing suspended
 * around it — the restraint is the design. Every element that used to sit
 * outside this group was removed because five layers of visible circuitry
 * is already a lot of detail, and detail only reads as expensive when it
 * has empty space around it.
 */
export function CoreStack() {
  const group = useRef<THREE.Group>(null)
  const phase = useExperience((s) => s.phase)
  const setFocused = useExperience((s) => s.setFocused)

  useFrame(({ clock }) => {
    if (!group.current) return
    const t = clock.elapsedTime
    // Deliberately almost still, and square to the lens. A continuously
    // turning object is never symmetric, and symmetry is what makes this
    // read as engineered. The motion budget goes to the current running
    // through the copper and to the camera instead.
    group.current.rotation.y = Math.sin(t * 0.11) * 0.05
    group.current.rotation.x = Math.sin(t * 0.19) * 0.012
    group.current.rotation.z = Math.cos(t * 0.15) * 0.008
  })

  const tapLayer = (index: number) => (e: ThreeEvent<MouseEvent>) => {
    if (phase !== 'interactive') return
    e.stopPropagation()
    setFocused(index)
  }

  return (
    <group ref={group}>
      {SERVICES.map((service, i) => (
        <group key={service.id} onPointerDown={tapLayer(i)}>
          <Wafer index={i} y={LAYER_Y[i]} seed={1471 + i * 977} accent={service.accent} />
          {/* An invisible slab per layer, so tapping a wafer in interactive
              mode has something with real thickness to hit. Copper alone is
              thin lines and nearly impossible to hit on a phone. */}
          <mesh position={[0, LAYER_Y[i], 0]} visible={false}>
            <boxGeometry args={[WAFER_SIZE, 0.14, WAFER_SIZE]} />
          </mesh>
        </group>
      ))}
      <Die />
      <ViaBeams />
      {/* Inside the rotating group: the signal has to travel the board, not
          across a board that is turning underneath it. */}
      <Packet />
    </group>
  )
}
