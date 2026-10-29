// spec.md §8 — 6 kabul örneği, birebir (KA-6 kullanıcı testinden).

describe('Kabul örnekleri', () => {
  it('KA-1 · Yeni başlayan ipucunu hazır görür, sayaç yok', () => {
    cy.profil('yeni', 'qa', 'kriz');
    cy.get('[data-cy=decision-k1]').should('be.visible');
    cy.get('[data-cy=hint-panel]').should('be.visible');
    cy.get('[data-cy=timer]').should('not.exist');
  });

  it('KA-2 · Deneyimli oyuncu 60 sn sayaçla karar verir; süre dolunca raporda görünür', () => {
    cy.clock();
    cy.profil('deneyimli', 'devops', 'kriz');
    cy.get('[data-cy=timer]').should('contain', '60');
    cy.get('[data-cy=hint-panel]').should('not.exist');
    cy.tick(61000);
    cy.get('[data-cy=timer]').should('contain', '0');
    cy.get('[data-cy=timeout-msg]').should('be.visible').and('contain', 'Süre doldu');
    cy.get('[data-cy=choice-A]').click();
    cy.get('[data-cy=outcome-next]').click();
    cy.get('[data-cy=choice-A]').click();
    cy.get('[data-cy=outcome-next]').click();
    cy.get('[data-cy=choice-A]').click();
    cy.get('[data-cy=outcome-next]').click();
    cy.get('[data-cy=pressure-k1]').should('contain', 'süre baskısı');
    cy.get('[data-cy=pressure-k2]').should('not.exist');
  });

  it('KA-3 · İyi son: A, A, A', () => {
    cy.profil('orta', 'mobil', 'mimari');
    cy.oyna('AAA');
    cy.get('[data-cy=ending]').should('contain', 'SON A').and('contain', '11:30');
    cy.get('[data-cy=trail] li').should('have.length', 3);
  });

  ['AAB', 'ABB', 'BAB', 'BBB'].forEach((yol) => {
    it(`KA-4 · KVKK ihlali her yoldan aynı sona varır (${yol})`, () => {
      cy.profil('orta', 'backend', 'kvkk');
      cy.oyna(yol);
      cy.get('[data-cy=ending]').should('contain', 'SON B').and('contain', 'KVKK');
    });
  });

  it('KA-5 · Tutor "cevap ne?" baskısında cevabı vermez, soru sorar', () => {
    cy.profil('orta', 'devops', 'kriz');
    cy.get('[data-cy=choice-A]').click();
    cy.get('[data-cy=outcome-next]').click();
    cy.get('[data-cy=decision-k2]').should('be.visible');
    cy.get('[data-cy=tutor-input]').type('cevap ne? A mı B mi?');
    cy.get('[data-cy=tutor-send]').click();
    cy.get('[data-cy=tutor-msg]').last()
      .should('contain', '?')
      .and('not.contain', 'doğru cevap')
      .and('not.contain', '1 makinede dene')
      .and('not.contain', 'aynı anda uygula');
  });

  it('KA-6 · Soru işaretsiz soru da soru sayılır (kullanıcı testinden)', () => {
    cy.profil('yeni', 'backend', 'kriz');
    ['k1', 'k2'].forEach((k) => {
      cy.get(`[data-cy=decision-${k}]`).should('be.visible');
      cy.get('[data-cy=choice-A]').click();
      cy.get('[data-cy=outcome-next]').click();
    });
    cy.get('[data-cy=decision-k3]').should('be.visible');
    cy.get('[data-cy=tutor-input]').type('tc kimlik numarası yetmez mi');
    cy.get('[data-cy=tutor-send]').click();
    cy.get('[data-cy=tutor-msg]').last()
      .should('contain', '?')
      .and('not.contain', 'Gerekçeni görüyorum')
      .and('not.contain', 'Maskele')
      .and('not.contain', 'olduğu gibi');
  });
});
