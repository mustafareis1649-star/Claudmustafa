# Cloudflare Pages'e Deploy Etme

Bu proje artık Vercel veya Supabase'e ihtiyaç duymuyor. Statik bir Vite/React
uygulaması olarak derleniyor ve tamamen Cloudflare Pages üzerinde barındırılabilir.

## 1) Cloudflare Pages'te yeni proje oluştur
- dash.cloudflare.com → Workers & Pages → Create → Pages → "Connect to Git"
- Bu klasörü push ettiğin GitHub reposunu seç

## 2) Build ayarları
- Framework preset: **Vite** (veya "None" seçip aşağıdakileri elle gir)
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: (repo'nun kökü neresiyse, itdocsy/itdocsy gibi bir alt
  klasördeyse burada onu belirt)
- Environment variables: **gerek yok** — proje artık Supabase/Paddle
  kullanmıyor, hiçbir env değişkeni gerektirmiyor.

## 3) SPA yönlendirmesi
`public/_redirects` dosyası projeye eklendi:
```
/*  /index.html  200
```
Bu, react-router ile çalışan tüm sayfaların (ör. `/merge-pdf`, `/photo-editor`)
doğrudan adres çubuğuna yazıldığında veya sayfa yenilendiğinde 404 vermeden
doğru şekilde açılmasını sağlıyor. Build sırasında Cloudflare bu dosyayı
otomatik olarak `dist/` içine kopyalar.

## 4) Deploy
Save and Deploy'a bas. İlk deploy birkaç dakika sürebilir. Sonrasında her
`git push`'ta otomatik yeniden deploy olur.

## Custom domain
Pages projesi oluştuktan sonra "Custom domains" sekmesinden kendi alan
adını bağlayabilirsin (Cloudflare'de yönetiyorsan otomatik, değilse
CNAME/DNS talimatlarını takip ederek).

## Not: giriş / abonelik sistemi kaldırıldı
Site artık hesap, giriş, kayıt veya ücretli plan içermiyor — tüm araçlar
girişsiz ve sınırsız kullanılabiliyor. Supabase, Paddle, `/account` sayfası
ve fiyatlandırma bölümü projeden tamamen çıkarıldı.

## Önemli: dosyaları TEK TEK kopyalama
Bundan sonra bir güncelleme gönderdiğimde, sana ya "değişen dosyalar" zip'i
ya da "tam proje" zip'i vereceğim. **Tam proje zip'i** gönderdiysem, onu
mevcut klasörünün YERİNE koy (eskisini sil, yenisini aç) — üzerine
kopyalama, karıştırmadan kaçınmak için. Sadece "değişen dosyalar" zip'i
gönderdiysem, o zaman içindeki dosyaları aynı isim/yol ile projenin
üzerine kopyala.
