# Digital Hal Playbook

Bu doküman, meyve-sebze odaklı dijital hal/marketplace projelerinde sık karşılaşılan iş mantığı kalıplarını ve karar noktalarını özetler. Amaç, **İş Mantığı Kılavuzu AI**’nın doğru soruları sormasını kolaylaştırmaktır.

---

## 1) Terimler

- **Hal:** Toptan meyve-sebze ticaretinin yoğunlaştığı pazar yapısı.
- **Bayi:** Haldaki satıcı tarafı; ürün listeleyen, fiyat belirleyen veya stok yöneten taraf.
- **Tedarikçi:** Ürünü sağlayan taraf (bazen bayi ile aynı, bazen ayrı).
- **Ardiye / Depo:** Ürünlerin giriş kabul, kalite kontrol, stoklama, hazırlama ve çıkışını yapan operasyon birimi.
- **Lot/Batch:** Aynı ürünün belirli bir tedarik/giriş partisinin kimliği (tarih, tedarikçi, kalite, maliyet).
- **Substitution:** Ürün bulunamazsa yerine alternatif ürün/grade gönderme.

---

## 2) Tipik aktörler ve amaçları

### B2C Müşteri
- Hızlı sipariş, net teslimat zamanı, iyi kalite
- Ürün bulunamazsa ne olacağı (substitution) kritik

### B2B İşletme
- Düzenli tedarik, uygun fiyat, esneklik
- Fiyat listesi / özel fiyat / iskonto / vade ihtimali
- Minimum sipariş ve sabit teslimat slotları

### Operasyon / Depo
- Hızlı hazırlama
- Doğru stok
- İade/eksik ürün yönetimi
- Kalite kontrol ve fire takibi

---

## 3) Ürün ve birim gerçekleri

Meyve-sebzede “tek tip ürün” yoktur. Tipik farklılıklar:

- **Birim:** kg, adet, kasa, bağ
- **Değişken ağırlık:** kasa/adet bazlı satıp kg’a göre final fiyat hesaplanabilir
- **Kalite/grade:** 1. sınıf / 2. sınıf / seçme / yemeklik
- **Boy/ebat:** küçük-orta-büyük
- **Mevsimsellik ve fiyat oynaklığı** yüksek

> Kritik soru: **fiyat** “ürün”e mi bağlı, “lot”a mı bağlı, “gün”e mi bağlı?

---

## 4) Fiyatlandırma kalıpları

### A) Basit marj (MVP için ideal)
- Cost (hal alış) + sabit marj → satış fiyatı
- B2B: daha düşük marj
- B2C: daha yüksek marj

### B) Çoklu fiyat listesi
- B2B segmentlerine göre fiyat listeleri
- Bayi bazlı farklı fiyatlar
- Kampanya/indirim

### C) Gün içi fiyat güncelleme
- Spot fiyatlar
- Cut-off sonrası yeni fiyat geçerli

> Kritik soru: Sipariş verildiğinde “fiyat kilitlenir mi” yoksa “hazırlanırken güncellenir mi”?

---

## 5) Stok / rezervasyon kalıpları

### A) Basit stok (MVP)
- inventory_count (tahmini)
- sipariş geldiğinde düş
- fire/kalite kaybı yönetimi basit

### B) Rezervasyonlu stok
- Order submitted → stok reserve
- Confirmed → picking’e girer
- Cancel → rezervasyon iade olur

### C) Lot bazlı stok
- inventory_lots (maliyet ve kalite farkı)
- FIFO/FEFO gibi stratejiler

> Kritik soru: Depo “hangi lot”tan hazırlıyor? Bu MVP’de şart mı?

---

## 6) Sipariş akışı ve cut-off

Meyve-sebzede teslimat planı kritik:

- Gün içi teslimat slotları
- Kesim saati:
  - Örn. 10:00’dan önce verilen sipariş aynı gün
  - sonrası ertesi gün
- Substitution tercihleri:
  - “benzer ürün kabul”
  - “aynı ürün farklı grade kabul”
  - “asla substitution istemiyorum”

---

## 7) İptal / iade / eksik ürün

Sık senaryolar:

- Ürün stokta bitti → substitution / kısmi iptal
- Ürün geldi ama kalite düşük → iade / para iadesi
- Eksik ürün → kısmi iade
- B2B’de iade süreçleri farklı olabilir (kredi notu / fatura düzeltme)

---

## 8) Güvenlik ve yetkilendirme

Marketplace tarzında en kritik hata: **tenant izolasyonu**.

- Bayi başka bayinin siparişini görebilir mi? (genellikle hayır)
- Depo tüm siparişleri görür ama fiyat/marj görmez mi?
- Operasyon admin kim?

Supabase kullanıyorsanız:
- RLS “deny by default”
- tenant alanı standardı (vendor_id / organization_id) erken seçilmeli

---

## 9) MVP için önerilen basitleştirmeler

Eğer hız kritikse, MVP’de şu kısımlar sadeleştirilebilir:

- Lot bazlı stok yerine ürün bazlı stok
- Çoklu fiyat listesi yerine tek fiyat + segment marjı
- İade süreçlerinde “kredi notu” yerine “para iadesi”
- B2B vadeli ödeme yerine “havale/ön ödeme”

---

## 10) Açık sorular kataloğu

Bu projelerde mutlaka sorulması gereken sorular:

1. B2B müşterilerde “organizasyon/şube” var mı?
2. Fiyat “sipariş anında” mı kilitleniyor?
3. Stok rezervasyonu var mı?
4. Cut-off ve teslimat slotları nasıl?
5. Substitution politikası nedir?
6. B2B’de vade/fatura süreci var mı?
7. Depo hangi ekranları kullanacak?
8. Tenant modeli: bayi mi tenant, şirket mi tenant?

Bu sorular netleşmeden, “kalıcı” bir mimari kurmak zordur.
