// v2 demo videosu (≈80 sn): AYNI sahnede (Karar 2 · Test) model iki oyuncu için iki farklı karar veriyor.
// Kararı gerçek model verir (eşik parametresi yok); süreler gerçek, beklemeler hızlandırılmadı.
// Yayındaki model eval kapısını geçemediği için GÖLGE modda: karar rozette görünür, oyunu değiştirmez.
// 3. bölüm, aynı politikanın eşiği geçen bir modelde nasıl görüneceğini gösterir (?golge=kapali, test/demoya özel).
// npm run cy:demo → cypress/videos/demo2.cy.js.mp4
const bekle = (ms) => cy.wait(ms);
const url = (baslik, ek = '') => `/?sira=sabit&baslik=${encodeURIComponent(baslik)}${ek}`;

const oyna = ({ baslik, ek, giris, k1Bekle, k1, sonucOku }) => {
  cy.visit(url(baslik, ek));
  bekle(1500);
  cy.get('[data-cy=opt-level-orta]').click(); bekle(300);
  cy.get('[data-cy=opt-role-devops]').click(); bekle(300);
  cy.get('[data-cy=opt-goal-kriz]').click(); bekle(300);
  cy.get('[data-cy=start]').click();
  bekle(giris);
  cy.get('[data-cy=intro-next]').click();
  bekle(k1Bekle);                           // 1. kararda geçen süre (modelin girdisi)
  cy.get(`[data-cy=choice-${k1}]`).click();
  bekle(sonucOku);                          // sonuç kartını okuma süresi (modelin girdisi)
  cy.get('[data-cy=outcome-next]').click();
  cy.get('[data-cy=decision-k2]').should('be.visible');
  bekle(1500);
  cy.get('[data-cy=model-rozet]').scrollIntoView(); bekle(5500);
};

describe('Demo v2 · aynı sahne, iki oyuncu, iki model kararı', () => {
  it('Oyuncu 1 · aceleci', () => {
    oyna({ baslik: 'Oyuncu 1 · aceleci: 1. kararı 2 sn’de veriyor', giris: 3000, k1Bekle: 2000, k1: 'A', sonucOku: 2000 });
    cy.get('[data-cy=model-rozet]').should('contain', 'EDERDİ');
  });

  it('Oyuncu 2 · dikkatli', () => {
    oyna({ baslik: 'Oyuncu 2 · dikkatli: 1. kararı 15 sn düşünüyor', giris: 4000, k1Bekle: 15000, k1: 'B', sonucOku: 12000 });
    cy.get('[data-cy=model-rozet]').should('contain', 'ETMEZDİ');
  });

  it('Eşiği geçen bir model olsaydı (test modu)', () => {
    oyna({ baslik: 'Model kabul edilseydi: aynı aceleci oyuncuya tutor devreye girer', ek: '&golge=kapali', giris: 3000, k1Bekle: 2000, k1: 'A', sonucOku: 2000 });
    cy.get('[data-cy=model-mudahale]').scrollIntoView(); bekle(4000);
  });
});
