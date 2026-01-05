# Doküman Stil Rehberi

Amaç: Dokümanlar tek bir ekip tarafından yazılmış gibi dursun.

---

## 1) Dil ve ton

- Dil: Türkçe
- Teknik terimler: gerektiğinde İngilizce (API, migration, RLS, RBAC)
- Cümleler: kısa ve net
- Belirsizlik: “varsayım” olarak etiketle

---

## 2) Başlık standardı

- H1: Doküman adı
- H2: Ana bölümler
- H3: Alt başlıklar

Örnek:
- 1) Amaç
- 2) Kapsam
- 3) Varsayımlar
- 4) Kararlar
- 5) Edge-case’ler
- 6) Açık Sorular
- 7) Riskler
- 8) Next Iteration

---

## 3) Diyagramlar

- Mermaid kullan
- En az:
  - order lifecycle state diagram
  - context diagram veya entity ilişkisi

---

## 4) Decision logging

- “Neden böyle yaptık?” sorusu her kararın yanında olmalı.
- Büyük kararlar ADR’de.

---

## 5) Dosya isimleri

- lowercase + kebab-case
- klasörler: `00-overview`, `01-product` gibi numaralı

---

## 6) Definition of Done

Bir doküman “done” değilse “Draft” diye işaretle ve eksiklerini altına yaz.
