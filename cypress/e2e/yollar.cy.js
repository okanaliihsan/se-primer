// B1: 8 karar yolunun her biri bir sona ulaşır ve spec.md §6'daki kurala uyar.
const beklenen = {
  AAA: 'SON A',
  ABA: 'SON C', BAA: 'SON C', BBA: 'SON C',
  AAB: 'SON B', ABB: 'SON B', BAB: 'SON B', BBB: 'SON B'
};

describe('Tüm karar yolları (8/8)', () => {
  Object.entries(beklenen).forEach(([yol, son]) => {
    it(`${yol} → ${son}`, () => {
      cy.profil('orta', 'backend', 'mimari');
      cy.oyna(yol);
      cy.get('[data-cy=ending]').should('contain', son);
      cy.get('[data-cy=trail] li').should('have.length', 3);
    });
  });
});
