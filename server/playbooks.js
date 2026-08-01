/**
 * AŞAMA 20 — Komuta playbook şablonları (hızlı talimat).
 */

import { randomBytes } from 'node:crypto';
import { readCollection, writeCollection, prependItem, deleteItem } from './store.js';
import { appendAudit } from './audit.js';

const DEFAULT_PLAYBOOKS = [
  {
    id: 'pb_de_launch',
    title: 'Almanca lansman zinciri',
    category: 'kreatif',
    prompt:
      'OlymposPass için Almanca lansman metni hazırla; kültürel bağlamı koru ve ETHOS denetiminden geçir.',
    brandIds: ['brand_olympospass', 'brand_likya'],
  },
  {
    id: 'pb_herodot_gate',
    title: 'Turnikesiz geçiş istihbaratı',
    category: 'rnd',
    prompt:
      "Avrupa'daki turnikesiz geçiş sistemlerini incele; OlymposPass için kısa rekabet özeti çıkar.",
    brandIds: ['brand_olympospass', 'brand_likya'],
  },
  {
    id: 'pb_chef_rush',
    title: 'Yoğun saat mutfak planı',
    category: 'ops',
    prompt:
      'Öğle yoğunluğu için Daze Chef mutfak istasyon planı ve 2 dk teslim kuralı hatırlatması hazırla.',
    brandIds: ['brand_daze'],
  },
  {
    id: 'pb_crew_brief',
    title: 'Crew vardiya brifingi',
    category: 'hr',
    prompt:
      'Daze Crew akşam vardiyası için centilmenlik odaklı kısa brifing metni yaz; SOCRATES ilkelerini işle.',
    brandIds: ['brand_daze'],
  },
  {
    id: 'pb_nexus_check',
    title: 'NEXUS kapı sağlığı',
    category: 'tech',
    prompt:
      'NEXUS turnike ve RFID cihazları için günlük sağlık kontrol checklist’i oluştur.',
    brandIds: ['brand_olympospass', 'brand_likya'],
  },
];

function ensureSeed() {
  const list = readCollection('playbooks', null);
  if (!Array.isArray(list) || list.length === 0) {
    writeCollection('playbooks', DEFAULT_PLAYBOOKS);
    return DEFAULT_PLAYBOOKS;
  }
  return list;
}

export function listPlaybooks(brandId) {
  const all = ensureSeed();
  if (!brandId) return all;
  return all.filter(
    (p) => !p.brandIds?.length || p.brandIds.includes(brandId),
  );
}

export function createPlaybook(input, actor = 'system') {
  const pb = {
    id: `pb_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    title: String(input.title || 'Playbook').trim(),
    category: input.category || 'genel',
    prompt: String(input.prompt || '').trim(),
    brandIds: Array.isArray(input.brandIds) ? input.brandIds : [],
    createdAt: new Date().toISOString(),
  };
  prependItem('playbooks', pb, 100);
  appendAudit({
    actor,
    action: 'playbooks.create',
    detail: pb.title,
    meta: { id: pb.id },
  });
  return pb;
}

export function removePlaybook(id, actor = 'system') {
  const pb = ensureSeed().find((p) => p.id === id);
  if (!pb) return null;
  deleteItem('playbooks', id);
  appendAudit({
    actor,
    action: 'playbooks.delete',
    detail: pb.title,
    meta: { id },
  });
  return pb;
}
