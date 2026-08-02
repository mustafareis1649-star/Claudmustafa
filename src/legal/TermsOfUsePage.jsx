import { useI18n } from '../shell/i18n/I18nContext';
import LegalPage from './LegalPage';

const CONTENT = {
  tr: {
    title: 'Kullanım Şartları',
    updated: 'Son güncelleme: Ağustos 2026',
    body: (
      <div className="legal-body">
        <h2>1. Hizmet</h2>
        <p>
          itdocsy, PDF ve görsel dosyalarınız üzerinde birleştirme, sıkıştırma, dönüştürme,
          imzalama gibi işlemler yapmanızı sağlayan bir araç setidir. Araçların büyük
          çoğunluğu tarayıcınızda çalışır; dosyalarınız işlem için sunucularımıza yüklenmez.
        </p>

        <h2>2. Ücretsiz ve sınırsız kullanım</h2>
        <p>
          itdocsy'deki tüm araçlar tamamen ücretsizdir. Herhangi bir hesap oluşturmanıza,
          giriş yapmanıza veya bir plana abone olmanıza gerek yoktur; dosya birleştirme,
          dönüştürme, imzalama gibi tüm işlemleri sınırsız şekilde kullanabilirsiniz.
        </p>

        <h2>3. Kabul edilebilir kullanım</h2>
        <p>
          Hizmeti yasa dışı içerik üretmek, başkalarının haklarını ihlal etmek veya kötüye
          kullanmak amacıyla kullanamazsınız.
        </p>

        <h2>4. Sorumluluğun sınırlandırılması</h2>
        <p>
          Araçlar "olduğu gibi" sunulur. İşlenen dosyaların doğruluğu, bütünlüğü veya
          belirli bir amaca uygunluğu konusunda yasaların izin verdiği ölçüde garanti
          verilmez.
        </p>

        <h2>5. İletişim</h2>
        <p>
          Sorularınız için <a href="mailto:itdocsy@gmail.com">itdocsy@gmail.com</a> üzerinden
          bize ulaşabilirsiniz.
        </p>
      </div>
    ),
  },
  en: {
    title: 'Terms of Use',
    updated: 'Last updated: August 2026',
    body: (
      <div className="legal-body">
        <h2>1. The service</h2>
        <p>
          itdocsy is a set of tools for working with PDF and image files — merging,
          compressing, converting, signing, and more. Most tools run in your browser;
          your files are not uploaded to our servers for processing.
        </p>

        <h2>2. Free and unlimited use</h2>
        <p>
          Every tool on itdocsy is completely free to use. There's no need to create an
          account, sign in, or subscribe to any plan — merging, converting, signing, and
          every other operation is available to everyone, with no usage limits.
        </p>

        <h2>3. Acceptable use</h2>
        <p>
          You may not use the service to create unlawful content, infringe others' rights,
          or otherwise abuse the platform.
        </p>

        <h2>4. Limitation of liability</h2>
        <p>
          Tools are provided "as is." To the extent permitted by law, we make no warranty
          as to the accuracy, integrity, or fitness for a particular purpose of processed
          files.
        </p>

        <h2>5. Contact</h2>
        <p>
          Questions? Reach us at <a href="mailto:itdocsy@gmail.com">itdocsy@gmail.com</a>.
        </p>
      </div>
    ),
  },
};

export default function TermsOfUsePage() {
  const { lang } = useI18n();
  const c = CONTENT[lang] || CONTENT.en;
  return (
    <LegalPage title={c.title} updated={c.updated}>
      {c.body}
    </LegalPage>
  );
}
