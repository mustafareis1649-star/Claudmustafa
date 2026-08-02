import { useI18n } from '../shell/i18n/I18nContext';
import LegalPage from './LegalPage';

const CONTENT = {
  tr: {
    title: 'Gizlilik Politikası',
    updated: 'Son güncelleme: Ağustos 2026',
    body: (
      <div className="legal-body">
        <h2>1. Dosyalarınız sunucularımıza yüklenmez</h2>
        <p>
          itdocsy'deki PDF ve görsel araçlarının büyük çoğunluğu tamamen tarayıcınızda
          çalışır. Bir dosyayı işlerken (birleştirme, sıkıştırma, dönüştürme, imzalama vb.)
          dosya cihazınızdan ayrılmaz; bizim sunucularımıza kopyalanmaz veya depolanmaz.
          İşlem bittiğinde dosya sekmenizi kapattığınızda tarayıcının hafızasından da silinir.
        </p>

        <h2>2. Topladığımız veriler</h2>
        <p>itdocsy'de üyelik/hesap sistemi ve ücretli plan bulunmuyor; tüm araçlar giriş yapmadan ve sınırsız şekilde kullanılabilir. Topladığımız sınırlı veriler:</p>
        <ul>
          <li>Bize e-posta ile ulaştığınızda paylaştığınız iletişim bilgileri,</li>
          <li>Siteyi nasıl kullandığınıza dair anonim/istatistiksel kullanım verileri (ör. hangi araçların daha çok kullanıldığı).</li>
        </ul>

        <h2>3. Çerezler</h2>
        <p>
          Dil tercihinizi hatırlamak ve site kullanımını iyileştirmek için sınırlı sayıda
          çerez/yerel depolama kullanılabilir. Bu çerezler kimliğinizi tespit etmek için
          kullanılmaz.
        </p>

        <h2>4. Verilerinizi kimseyle satmıyoruz</h2>
        <p>
          Topladığımız sınırlı verileri üçüncü taraflara satmıyor veya pazarlama amacıyla
          kiralamıyoruz. Veriler yalnızca hizmeti sunmak ve iyileştirmek için kullanılır.
        </p>

        <h2>5. Haklarınız</h2>
        <p>
          6698 sayılı KVKK kapsamında verilerinizin ne şekilde işlendiğini öğrenme, düzeltilmesini
          veya silinmesini talep etme hakkına sahipsiniz. Talepleriniz için{' '}
          <a href="mailto:itdocsy@gmail.com">itdocsy@gmail.com</a> adresinden bize ulaşabilirsiniz.
        </p>

        <h2>6. Değişiklikler</h2>
        <p>
          Bu politika, hizmetlerimiz geliştikçe güncellenebilir. Önemli değişiklikleri bu
          sayfa üzerinden duyururuz.
        </p>
      </div>
    ),
  },
  en: {
    title: 'Privacy Policy',
    updated: 'Last updated: August 2026',
    body: (
      <div className="legal-body">
        <h2>1. Your files never touch our servers</h2>
        <p>
          Most itdocsy tools run entirely in your browser. When you process a file
          (merging, compressing, converting, signing, etc.) it never leaves your device —
          it is not uploaded to or stored on our servers. Once you close the tab, it's
          gone from memory too.
        </p>

        <h2>2. What we collect</h2>
        <p>itdocsy has no accounts and no paid plans — every tool is free to use, with no sign-up and no limits. The limited data we do handle:</p>
        <ul>
          <li>Contact details you share when emailing us,</li>
          <li>Anonymous/aggregate usage statistics (e.g. which tools are used most).</li>
        </ul>

        <h2>3. Cookies</h2>
        <p>
          We may use a limited amount of cookies/local storage to remember your language
          preference and improve the site. These are not used to identify you personally.
        </p>

        <h2>4. We don't sell your data</h2>
        <p>
          We don't sell or rent the limited data we collect to third parties for marketing
          purposes. Data is used only to run and improve the service.
        </p>

        <h2>5. Your rights</h2>
        <p>
          You can ask what data we hold about you, request a correction, or request deletion
          at any time by emailing <a href="mailto:itdocsy@gmail.com">itdocsy@gmail.com</a>.
        </p>

        <h2>6. Changes</h2>
        <p>
          This policy may be updated as our service evolves. We'll post significant changes
          on this page.
        </p>
      </div>
    ),
  },
};

export default function PrivacyPolicyPage() {
  const { lang } = useI18n();
  const c = CONTENT[lang] || CONTENT.en;
  return (
    <LegalPage title={c.title} updated={c.updated}>
      {c.body}
    </LegalPage>
  );
}
