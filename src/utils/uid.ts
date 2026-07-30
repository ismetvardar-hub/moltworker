let counter = 0;

/**
 * Çakışmayan benzersiz kimlik üretir.
 * Date.now() tek başına aynı milisaniyedeki iki çağrıda çakışır (örn. hızlı
 * çift tıklama) ve React key hatasına yol açar; artan sayaçla ayrıştırılır.
 */
export function uid(): number {
  counter = (counter + 1) % 1000;
  return Date.now() * 1000 + counter;
}
