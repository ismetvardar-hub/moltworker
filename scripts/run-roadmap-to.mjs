#!/usr/bin/env node
/**
 * Generate consecutive 15-stage batches from (start) to (endInclusive),
 * invoking gen-stage-batch.mjs for each slice.
 *
 * Usage: node scripts/run-roadmap-to.mjs <fromStage> <toStageInclusive>
 * Example: node scripts/run-roadmap-to.mjs 691 900
 */
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const from = Number(process.argv[2]);
const to = Number(process.argv[3]);
if (!from || !to || from > to) {
  console.error('Usage: node scripts/run-roadmap-to.mjs <from> <to>');
  process.exit(1);
}

const require = createRequire(import.meta.url);
const lucide = require('lucide-react');
const ICON_POOL = [
  'Activity','Anchor','Award','BadgeCheck','Bell','BookOpen','Boxes','Brain','Briefcase',
  'Building2','Bus','Calculator','Camera','Castle','CircuitBoard','ClipboardList','Cloud',
  'Coins','Compass','Cpu','Crown','Database','Diamond','DoorOpen','Droplets','Factory',
  'FileText','Fish','Flame','Flower2','Gauge','Gem','Globe2','Hammer','Handshake','Heart',
  'Hexagon','Hotel','KeyRound','Landmark','Layers','Leaf','Lightbulb','Lock','Map','Medal',
  'Megaphone','MoonStar','Mountain','Network','Orbit','Package','Palette','Radar','Radio',
  'Rocket','Route','Scale','ScanEye','Shield','Ship','Sparkles','Star','Store','Sun',
  'Target','Ticket','Trees','Trophy','Truck','Users','Wallet','Waves','Wind','Wrench','Zap',
].filter((i) => lucide[i]);

const THEMES = [
  { title: 'Identity OS', cp: 'bastion', desc: 'kimlik · erişim · güvenlik özeti.', short: 'kimlik özeti.' },
  { title: 'Alliance OS', cp: 'alliance', desc: 'ortaklık · franchise · B2B özeti.', short: 'ortaklık özeti.' },
  { title: 'Supply OS', cp: 'artery', desc: 'tedarik · lojistik omurga özeti.', short: 'tedarik özeti.' },
  { title: 'Dominion Seal', cp: 'dominion', desc: 'komuta mühür · konsolidasyon özeti.', short: 'mühür özeti.' },
  { title: 'Serenity OS', cp: 'serenity', desc: 'misafir huzur · deneyim özeti.', short: 'huzur özeti.' },
  { title: 'Circuit OS', cp: 'circuit', desc: 'platform · API · runtime özeti.', short: 'platform özeti.' },
  { title: 'Agora OS', cp: 'agora', desc: 'topluluk · üyelik · etkileşim özeti.', short: 'agora özeti.' },
  { title: 'Crucible OS', cp: 'crucible', desc: 'inovasyon · lab · pilot özeti.', short: 'inovasyon özeti.' },
  { title: 'Charter OS', cp: 'charter', desc: 'hukuk · risk · sözleşme özeti.', short: 'hukuk özeti.' },
  { title: 'Phoenix OS', cp: 'phoenix', desc: 'süreklilik · felaket · kurtarma özeti.', short: 'süreklilik özeti.' },
  { title: 'Frontier OS', cp: 'frontier', desc: 'büyüme · yeni pazar özeti.', short: 'büyüme özeti.' },
  { title: 'Prism OS', cp: 'prism', desc: 'kalite · standart · denetim özeti.', short: 'kalite özeti.' },
  { title: 'Monument OS', cp: 'monument', desc: 'miras · arşiv · kurumsal bellek özeti.', short: 'miras özeti.' },
  { title: 'Olympus Finale', cp: 'olympus', desc: 'LİKYA holding nihai mühür özeti.', short: 'nihai mühür.' },
];

const MODULE_STEMS = [
  ['accessgate','Access Gate','Kapı / erişim politikaları.','gate','policy'],
  ['idproof','ID Proof','Kimlik doğrulama kayıtları.','guestName','method'],
  ['rolegrant','Role Grant','Rol yetki atamaları.','person','role'],
  ['sessionguard','Session Guard','Oturum koruma olayları.','session','device'],
  ['devicetrust','Device Trust','Cihaz güven skoru.','device','score'],
  ['secretvault','Secret Vault','Gizli anahtar / secret kayıtları.','name','scope'],
  ['mfareg','MFA Reg','MFA kayıt / kayıt silme.','person','factor'],
  ['ssobridge','SSO Bridge','SSO köprü bağlantıları.','idp','app'],
  ['privacypol','Privacy Pol','Gizlilik politika onayları.','policy','version'],
  ['consentrow','Consent Row','Açık rıza satırları.','guestName','purpose'],
  ['breachlog','Breach Log','İhlal / sızıntı kayıtları.','severity','vector'],
  ['socqueue','SOC Queue','SOC olay kuyruğu.','alert','owner'],
  ['patchdesk','Patch Desk','Yama / patch işleri.','asset','cve'],
  ['zerohour','Zero Hour','Sıfırıncı saat tatbikatı.','drill','score'],
  ['partnerdesk','Partner Desk','Partner kayıt masası.','partner','tier'],
  ['franchise','Franchise','Franchise birimleri.','unit','region'],
  ['channelkit','Channel Kit','Kanal kit dağıtımı.','partner','kit'],
  ['rebate','Rebate','İskonto / rebate satırları.','partner','amount'],
  ['coinvest','Co Invest','Ortak yatırım kayıtları.','deal','amount'],
  ['slatrack','SLA Track','Partner SLA takibi.','partner','score'],
  ['jointpromo','Joint Promo','Ortak kampanyalar.','name','channel'],
  ['leadshare','Lead Share','Lead paylaşım kayıtları.','lead','partner'],
  ['b2border','B2B Order','B2B sipariş satırları.','buyer','sku'],
  ['wholesale','Wholesale','Toptan fiyat listeleri.','sku','price'],
  ['dealroom','Deal Room','Anlaşma odası notları.','deal','owner'],
  ['contractrow','Contract Row','Sözleşme satırları.','party','term'],
  ['commission','Commission','Komisyon hesapları.','partner','pct'],
  ['onboardkit','Onboard Kit','Partner onboarding kiti.','partner','step'],
  ['inboundpo','Inbound PO','Gelen satınalma siparişleri.','po','vendor'],
  ['outboundso','Outbound SO','Giden satış siparişleri.','so','buyer'],
  ['asntrack','ASN Track','ASN / sevsiyat takibi.','asn','carrier'],
  ['dockyard','Dock Yard','Rampa / dock yard.','bay','truck'],
  ['crossdock','Cross Dock','Cross-dock hareketleri.','from','to'],
  ['coldchain2','Cold Chain+','Soğuk zincir + izleme.','unit','tempC'],
  ['slotbook','Slot Book','Rampa slot rezervasyonu.','bay','slot'],
  ['carrierbid','Carrier Bid','Taşıyıcı teklifleri.','lane','rate'],
  ['freightbill','Freight Bill','Navlun faturaları.','carrier','amount'],
  ['milestonet','Milestone T','Teslim milestoneleri.','shipment','eta'],
  ['exceptionlog','Exception Log','Lojistik istisna logu.','code','note'],
  ['inventoryage','Inventory Age','Stok yaşlandırma.','sku','days'],
  ['replenplan','Replen Plan','İkmal planı.','sku','qty'],
  ['safetystock','Safety Stock','Emniyet stoğu.','sku','min'],
  ['supplierkpi','Supplier KPI','Tedarikçi KPI.','vendor','score'],
  ['cmdpulse','Cmd Pulse','Komuta nabız sinyali.','signal','value'],
  ['boardpulse','Board Pulse','Yönetim kurulu nabzı.','topic','score'],
  ['riskheat','Risk Heat','Risk ısı haritası.','domain','score'],
  ['cashpulse','Cash Pulse','Nakit nabız.','bucket','amount'],
  ['opsheat','Ops Heat','Operasyon ısı.','zone','score'],
  ['guestheat','Guest Heat','Misafir ısı.','segment','score'],
  ['brandheat','Brand Heat','Marka ısı.','brand','score'],
  ['agentpulse','Agent Pulse','Ajan nabız.','agent','status'],
  ['systempulse','System Pulse','Sistem nabız.','service','latency'],
  ['alertfuse','Alert Fuse','Alarm sigortası.','fuse','level'],
  ['warbrief','War Brief','Savaş odası brifing.','topic','owner'],
  ['decisionhub','Decision Hub','Karar merkezi.','decision','owner'],
  ['sealnote','Seal Note','Mühür notları.','seal','version'],
  ['legacyflag','Legacy Flag','Eski sistem bayrakları.','system','flag'],
  ['calmroom','Calm Room','Huzur odası rezervasyonu.','room','guestName'],
  ['quiethours','Quiet Hours','Sessiz saat profilleri.','zone','profile'],
  ['scentmood','Scent Mood','Koku ruh hali.','zone','scent'],
  ['pillowmenu','Pillow Menu','Yastık menüsü.','room','choice'],
  ['bathritual','Bath Ritual','Banyo ritüeli.','room','ritual'],
  ['sleepscore','Sleep Score','Uyku skoru.','guestName','score'],
  ['welcomeamen','Welcome Amen','Karşılama ikramı.','room','amenity'],
  ['farewell','Farewell','Veda jesti.','guestName','gift'],
  ['memorybook','Memory Book','Anı defteri.','guestName','note'],
  ['carecall','Care Call','İlgi araması.','guestName','topic'],
  ['surprisegift','Surprise Gift','Sürpriz hediye.','guestName','gift'],
  ['loyaltyhug','Loyalty Hug','Sadakat jesti.','guestName','tier'],
  ['feedbackloop','Feedback Loop','Geri bildirim döngüsü.','channel','score'],
  ['momentmap','Moment Map','An haritası.','moment','zone'],
  ['apigateway','API Gateway','API gateway rotaları.','route','method'],
  ['webhookhub','Webhook Hub','Webhook uçları.','url','event'],
  ['ratelimit2','Rate Limit+','Oran sınırı kuralları.','route','limit'],
  ['schemareg','Schema Reg','Şema kayıt defteri.','schema','version'],
  ['eventbus','Event Bus','Olay otobüsü.','topic','lag'],
  ['jobqueue2','Job Queue+','İş kuyruğu.','queue','depth'],
  ['cachemesh','Cache Mesh','Önbellek ağı.','node','hit'],
  ['cdnedge','CDN Edge','CDN kenar düğümleri.','edge','status'],
  ['observemap','Observe Map','Gözlem haritası.','service','slo'],
  ['errorbudget','Error Budget','Hata bütçesi.','service','burn'],
  ['featuregate','Feature Gate','Özellik kapısı.','flag','pct'],
  ['canaryrun','Canary Run','Canary koşuları.','service','version'],
  ['rollback','Rollback','Geri alma kayıtları.','service','version'],
  ['chaosdrill','Chaos Drill','Kaos tatbikatı.','target','score'],
  ['memberhub','Member Hub','Üye merkezi.','member','tier'],
  ['circle','Circle','Topluluk çemberleri.','circle','members'],
  ['meetup','Meetup','Buluşma etkinlikleri.','title','pax'],
  ['forummod','Forum Mod','Forum moderasyonu.','thread','flag'],
  ['polldesk','Poll Desk','Anket masası.','poll','votes'],
  ['badgeearn','Badge Earn','Rozet kazanımları.','member','badge'],
  ['questline','Quest Line','Görev hatları.','quest','progress'],
  ['volunteer','Volunteer','Gönüllü kayıtları.','person','role'],
  ['donation','Donation','Bağış kayıtları.','donor','amount'],
  ['chapter','Chapter','Bölüm / chapter.','city','lead'],
  ['ambassador2','Ambassador+','Elçi programı+.','name','region'],
  ['storywall','Story Wall','Hikaye duvarı.','story','author'],
  ['ritualcal','Ritual Cal','Ritüel takvimi.','ritual','date'],
  ['cohort','Cohort','Kohort tanımları.','name','size'],
  ['labbench','Lab Bench','Lab tezgahı.','experiment','owner'],
  ['pilotrun','Pilot Run','Pilot koşular.','pilot','site'],
  ['prototype','Prototype','Prototip kayıtları.','name','stage'],
  ['hypothesis','Hypothesis','Hipotez defteri.','claim','confidence'],
  ['metricslab','Metrics Lab','Metrik lab.','metric','value'],
  ['userboard','User Board','Kullanıcı panosu.','insight','owner'],
  ['patentdesk','Patent Desk','Patent / IP masası.','title','status'],
  ['sandbox','Sandbox','Sandbox ortamları.','env','owner'],
  ['hackday','Hack Day','Hack günü projeleri.','team','idea'],
  ['incubate','Incubate','Kuluçka projeleri.','project','stage'],
  ['spindesk','Spin Desk','Spin-out masası.','venture','owner'],
  ['researchnote','Research Note','Araştırma notları.','topic','author'],
  ['labbudget','Lab Budget','Lab bütçesi.','project','amount'],
  ['ipvault','IP Vault','IP kasası.','asset','owner'],
  ['legaldesk','Legal Desk','Hukuk masası.','matter','owner'],
  ['riskreg','Risk Reg','Risk kayıt defteri.','risk','score'],
  ['policyhub','Policy Hub','Politika merkezi.','policy','version'],
  ['claimdesk','Claim Desk','Talep / claim masası.','claim','amount'],
  ['insurancet','Insurance T','Sigorta poliçeleri.','policy','premium'],
  ['litigation','Litigation','Dava dosyaları.','case','status'],
  ['compliance2','Compliance+','Uyumluluk+.','control','owner'],
  ['ethicsline','Ethics Line','Etik hattı.','report','severity'],
  ['kycrow','KYC Row','KYC satırları.','party','level'],
  ['sanctions','Sanctions','Yaptırım taraması.','party','result'],
  ['datapriv','Data Priv','Veri gizliliği.','system','score'],
  ['retentionpol','Retention Pol','Saklama politikası.','dataset','days'],
  ['auditevidence','Audit Evidence','Denetim kanıtı.','control','link'],
  ['boardresolve','Board Resolve','YK kararları.','resolution','owner'],
  ['drplan','DR Plan','Felaket kurtarma planı.','system','rto'],
  ['backupjob','Backup Job','Yedekleme işleri.','system','size'],
  ['failover','Failover','Failover olayları.','system','result'],
  ['runbook','Runbook','Çalıştırma kitabı.','title','owner'],
  ['warroom2','War Room+','Savaş odası+.','incident','severity'],
  ['commsbridge2','Comms Bridge+','Kriz iletişimi+.','channel','status'],
  ['siteevac','Site Evac','Saha tahliyesi.','site','status'],
  ['coldsite','Cold Site','Cold site hazırlığı.','site','readiness'],
  ['hotspare','Hot Spare','Sıcak yedek.','asset','status'],
  ['drillscore','Drill Score','Tatbikat skoru.','drill','score'],
  ['vendorfail','Vendor Fail','Tedarikçi kesintisi.','vendor','impact'],
  ['powercut','Power Cut','Elektrik kesintisi.','zone','mins'],
  ['netsplit','Net Split','Ağ bölünmesi.','segment','status'],
  ['restorejob','Restore Job','Geri yükleme işi.','system','eta'],
  ['marketscan','Market Scan','Pazar taraması.','market','score'],
  ['sitehunt','Site Hunt','Yer seçimi.','city','score'],
  ['capextable','Capex Table','Yatırım tablosu.','project','amount'],
  ['softopen','Soft Open','Soft opening.','site','date'],
  ['launchpad','Launch Pad','Lansman pedı.','product','date'],
  ['localhire','Local Hire','Yerel işe alım.','site','headcount'],
  ['permitdesk','Permit Desk','İzin masası.','permit','authority'],
  ['landlease','Land Lease','Arazi kirası.','parcel','term'],
  ['buildphase','Build Phase','İnşaat fazı.','phase','pct'],
  ['ffespec','FFE Spec','FFE spesifikasyonu.','item','qty'],
  ['brandrollout','Brand Rollout','Marka rollout.','site','wave'],
  ['trainwave','Train Wave','Eğitim dalgası.','site','seats'],
  ['golive','Go Live','Canlıya alma.','site','checklist'],
  ['postlaunch','Post Launch','Lansman sonrası.','site','score'],
  ['qasample','QA Sample','Kalite örnekleri.','sku','score'],
  ['defectlog','Defect Log','Kusur kayıtları.','sku','defect'],
  ['standardop','Standard OP','Standart operasyon.','sop','version'],
  ['mysteryguest','Mystery Guest','Gizli müşteri+.','visit','score'],
  ['npsdeep','NPS Deep','Derin NPS.','segment','score'],
  ['servicemark','Service Mark','Hizmet işareti.','mark','score'],
  ['calibdesk','Calib Desk','Kalibrasyon masası.','asset','due'],
  ['labresult','Lab Result','Lab sonuçları.','sample','result'],
  ['certrenew','Cert Renew','Sertifika yenileme.','cert','expiry'],
  ['isotrack','ISO Track','ISO takip.','standard','status'],
  ['guestvoice','Guest Voice','Misafir sesi.','channel','score'],
  ['fixgate','Form Gate','Form kapısı.','form','version'],
  ['rootcause','Root Cause','Kök neden.','incident','cause'],
  ['corrective','Corrective','Düzeltici aksiyon.','action','owner'],
  ['archivebox','Archive Box','Arşiv kutusu.','box','years'],
  ['oralhistory','Oral History','Sözlü tarih.','speaker','topic'],
  ['artifact','Artifact','Kurumsal eser.','item','era'],
  ['timeline','Timeline','Zaman çizelgesi.','event','year'],
  ['foundersnote','Founders Note','Kurucu notu.','title','year'],
  ['brandbible','Brand Bible','Marka kutsal kitabı.','chapter','version'],
  ['museumdesk','Museum Desk','Müze masası.','exhibit','status'],
  ['heritage','Heritage','Miras varlıkları.','asset','era'],
  ['anniversary','Anniversary','Yıldönümü.','event','year'],
  ['alumni','Alumni','Mezun / alumni ağı.','person','cohort'],
  ['scholarship','Scholarship','Burs programı.','name','amount'],
  ['foundation','Foundation','Vakıf satırları.','program','amount'],
  ['legacygift','Legacy Gift','Miras hediyesi.','donor','amount'],
  ['storyvault','Story Vault','Hikaye kasası.','story','era'],
  ['olympulse','Olym Pulse','Olympos nabız.','metric','value'],
  ['holdingseal','Holding Seal','Holding mühür.','seal','version'],
  ['agentcourt','Agent Court','Ajan mahkemesi.','agent','verdict'],
  ['finalbrief','Final Brief','Nihai brifing.','topic','owner'],
  ['legacycode','Legacy Code','Miras kod bayrağı.','module','status'],
  ['eternallog','Eternal Log','Sonsuz log.','entry','era'],
  ['summitnote','Summit Note','Zirve notu.','title','owner'],
  ['constellate','Constellate','Takımyıldız eşlemesi.','node','links'],
  ['mythos','Mythos','Mit / anlatı.','myth','era'],
  ['aegisfinal','Aegis Final','Son kalkan.','layer','status'],
  ['crownfinal','Crown Final','Son taç.','tier','status'],
  ['vaultfinal','Vault Final','Son kasa.','account','balance'],
  ['empirefinal','Empire Final','Son imparatorluk sinyali.','signal','value'],
  ['nexusfinal','Nexus Final','Son NEXUS sinyali.','device','status'],
];

function existingIds() {
  return new Set(
    fs
      .readdirSync('server')
      .filter((f) => f.endsWith('.js'))
      .map((f) => f.replace(/\.js$/, '')),
  );
}

function uniqueId(base, taken) {
  let id = base.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!id) id = 'mod';
  if (!taken.has(id) && id.length >= 3) return id;
  for (let n = 2; n < 50; n++) {
    const c = `${id}${n}`;
    if (!taken.has(c)) return c;
  }
  return `${id}${Date.now().toString(36)}`;
}

function statusesFor(i) {
  const sets = [
    ['open', 'active', 'closed'],
    ['queued', 'running', 'done'],
    ['draft', 'live', 'archived'],
    ['ok', 'warn', 'alarm'],
    ['planned', 'doing', 'done'],
    ['pending', 'approved', 'rejected'],
    ['idle', 'busy', 'fault'],
    ['green', 'amber', 'red'],
  ];
  return sets[i % sets.length];
}

function buildSlice(startStage, theme, stemOffset, prevCp) {
  const taken = existingIds();
  // also reserve planned cp
  taken.add(theme.cp);
  const stages = [];
  for (let i = 0; i < 14; i++) {
    const stage = startStage + i;
    const stem = MODULE_STEMS[(stemOffset + i) % MODULE_STEMS.length];
    let [base, title, desc, f1, f2] = stem;
    const id = uniqueId(base, taken);
    taken.add(id);
    const icon = ICON_POOL[(stemOffset + i) % ICON_POOL.length];
    const statuses = statusesFor(stemOffset + i);
    const fields = {};
    fields[f1] = f1 === 'score' || f1 === 'amount' || f1 === 'qty' || f1 === 'pct' || f1 === 'value' || f1 === 'days' || f1 === 'min' || f1 === 'nights' || f1 === 'pax' || f1 === 'latency' || f1 === 'depth' || f1 === 'hit' || f1 === 'burn' || f1 === 'progress' || f1 === 'headcount' || f1 === 'seats' || f1 === 'years' || f1 === 'year' || f1 === 'links' || f1 === 'balance' || f1 === 'premium' || f1 === 'rto' || f1 === 'size' || f1 === 'mins' || f1 === 'tempC' || f1 === 'rate' || f1 === 'eta' || f1 === 'units' || f1 === 'budget' || f1 === 'price' || f1 === 'queue' || f1 === 'orders' || f1 === 'findings' || f1 === 'delta' || f1 === 'skus' || f1 === 'viewers' || f1 === 'votes' || f1 === 'members' || f1 === 'confidence' || f1 === 'kwh' || f1 === 'm3' || f1 === 'kg' || f1 === 'mwh' || f1 === 'tco2e' || f1 === 'kw' || f1 === 'items' || f1 === 'crew' || f1 === 'liters' || f1 === 'covers' || f1 === 'points' || f1 === 'cost' || f1 === 'total' || f1 === 'net' || f1 === 'diff' || f1 === 'plan' || f1 === 'lines' || f1 === 'days' ? '10' : 'Alpha';
    fields[f2] = f2 === 'score' || f2 === 'amount' || f2 === 'qty' || f2 === 'pct' || f2 === 'value' || f2 === 'days' || f2 === 'min' || f2 === 'price' || f2 === 'latency' || f2 === 'depth' || f2 === 'hit' || f2 === 'burn' || f2 === 'progress' || f2 === 'headcount' || f2 === 'seats' || f2 === 'years' || f2 === 'year' || f2 === 'links' || f2 === 'balance' || f2 === 'premium' || f2 === 'rto' || f2 === 'size' || f2 === 'mins' || f2 === 'tempC' || f2 === 'rate' || f2 === 'units' || f2 === 'budget' || f2 === 'queue' || f2 === 'orders' || f2 === 'findings' || f2 === 'delta' || f2 === 'skus' || f2 === 'viewers' || f2 === 'votes' || f2 === 'members' || f2 === 'confidence' || f2 === 'kwh' || f2 === 'm3' || f2 === 'kg' || f2 === 'mwh' || f2 === 'tco2e' || f2 === 'kw' || f2 === 'items' || f2 === 'crew' || f2 === 'liters' || f2 === 'covers' || f2 === 'points' || f2 === 'cost' || f2 === 'total' || f2 === 'net' || f2 === 'diff' || f2 === 'plan' || f2 === 'lines' || f2 === 'limit' || f2 === 'version' ? '5' : 'Beta';
    const numberFields = Object.keys(fields).filter((k) => /^\d+(\.\d+)?$/.test(String(fields[k])));
    stages.push({
      id,
      stage,
      title,
      desc,
      collection: id,
      prefix: id.slice(0, 3),
      fields,
      statuses,
      icon,
      ...(numberFields.length ? { numberFields } : {}),
    });
  }
  const cpStage = startStage + 14;
  const cpId = uniqueId(theme.cp, existingIds());
  const sigStages = [0, 2, 4, 6, 8, 10].map((idx) => stages[idx]);
  const signals = sigStages.map((s, i) => ({
    varName: `s${i}`,
    summaryFn: `${s.id}Summary`,
    module: s.id,
    key: `${s.id}Sig`,
    field: s.statuses[0],
  }));
  const summaryLines = [
    `${sigStages[0].title} ${'${s0.' + sigStages[0].statuses[0] + ' || 0}'} · ${sigStages[1].title} ${'${s1.' + sigStages[1].statuses[0] + ' || 0}'}`,
    `${sigStages[2].title} ${'${s2.' + sigStages[2].statuses[0] + ' || 0}'} · ${sigStages[3].title} ${'${s3.' + sigStages[3].statuses[0] + ' || 0}'}`,
    `${sigStages[4].title} ${'${s4.' + sigStages[4].statuses[0] + ' || 0}'} · ${sigStages[5].title} ${'${s5.' + sigStages[5].statuses[0] + ' || 0}'}`,
  ];
  return {
    sectionTitle: `${theme.title} · ${cpId[0].toUpperCase() + cpId.slice(1)} (AŞAMA ${startStage}–${cpStage})`,
    openapiFrom: `AŞAMA 1–${startStage - 1}`,
    openapiTo: `AŞAMA 1–${cpStage}`,
    prevCheckpoint: prevCp,
    stages,
    checkpoint: {
      id: cpId,
      stage: cpStage,
      title: cpId[0].toUpperCase() + cpId.slice(1),
      fullTitle: `LİKYA ${cpId[0].toUpperCase() + cpId.slice(1)}`,
      desc: theme.desc,
      shortDesc: theme.short,
      icon: ICON_POOL[(stemOffset + 14) % ICON_POOL.length],
      signals,
      summaryLines,
    },
  };
}

const prevId = process.argv[4];
const prevStage = Number(process.argv[5] || 0);
const prevSummary = process.argv[6] || (prevId ? prevId[0].toUpperCase() + prevId.slice(1) : '');
let prev = prevId
  ? { id: prevId, stage: prevStage, openapiSummary: prevSummary }
  : { id: 'verdant', stage: 690, openapiSummary: 'Verdant' };
let stemOffset = Number(process.argv[7] || 0);
let themeIdx = Number(process.argv[8] || 0);

for (let start = from; start <= to; start += 15) {
  const end = start + 14;
  if (end > to) {
    console.log('STOP short slice', start, to);
    break;
  }
  const theme = THEMES[themeIdx % THEMES.length];
  themeIdx++;
  const batch = buildSlice(start, theme, stemOffset, prev);
  stemOffset += 14;
  const path = `/tmp/batch-${start}-${end}.json`;
  fs.writeFileSync(path, JSON.stringify(batch, null, 2));
  console.log('GEN', path, '→', batch.checkpoint.id);
  const r = spawnSync('node', ['scripts/gen-stage-batch.mjs', path], { stdio: 'inherit' });
  if (r.status !== 0) {
    console.error('FAILED at', start);
    process.exit(r.status || 1);
  }
  prev = {
    id: batch.checkpoint.id,
    stage: batch.checkpoint.stage,
    openapiSummary: batch.checkpoint.title,
  };
}

console.log('ROADMAP_OK', from, '→', prev.stage, prev.id);
