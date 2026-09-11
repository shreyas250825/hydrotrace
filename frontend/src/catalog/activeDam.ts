/**
 * Active dam runtime for scene/coords modules that cannot subscribe to Zustand.
 */
import { BHAKRA_BOOTSTRAP } from '@/catalog/bootstrap'
import type { DamRecord } from '@/catalog/types'

let activeDamId = BHAKRA_BOOTSTRAP.id
let activeDam: DamRecord | null = BHAKRA_BOOTSTRAP

export function setActiveDam(dam: DamRecord) {
  activeDamId = dam.id
  activeDam = dam
}

export function getActiveDamId() {
  return activeDamId
}

export function getActiveDam(): DamRecord | null {
  return activeDam
}
