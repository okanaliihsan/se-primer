// Veri toplama modu (?mod=veri): her oyun 3 satır üretir, oyuncu kodu sayılır, kişisel veri istenmez.
describe('Veri toplama modu', () => {
  it('iki oyun → panelde 2 oyun, 6 karar; oyuncu kodu olmadan başlatılamaz', () => {
    cy.visit('/?mod=veri');
    cy.get('[data-cy=veri-band]').should('be.visible');
    cy.get('[data-cy=opt-level-orta]').click();
    cy.get('[data-cy=opt-role-qa]').click();
    cy.get('[data-cy=opt-goal-kriz]').click();
    cy.get('[data-cy=start]').should('be.disabled');
    cy.get('[data-cy=oyuncu-kodu]').type('o1');
    cy.get('[data-cy=start]').click();
    cy.get('[data-cy=intro-next]').click();
    cy.oyna('ABA');
    cy.get('[data-cy=veri-kaydedildi]').should('contain', 'kaydedildi');
    cy.get('[data-cy=veri-oturum]').should('contain', '1');
    cy.get('[data-cy=sonraki-oyuncu]').click();
    cy.get('[data-cy=opt-level-yeni]').click();
    cy.get('[data-cy=opt-role-mobil]').click();
    cy.get('[data-cy=opt-goal-kvkk]').click();
    cy.get('[data-cy=start]').click();
    cy.get('[data-cy=intro-next]').click();
    cy.oyna('BBB');
    cy.get('[data-cy=veri-oturum]').should('contain', '2');
    cy.get('[data-cy=veri-paneli]').click();
    cy.get('[data-cy=screen-veri]').should('contain', '2 oyun, 6 karar');
    cy.get('[data-cy=kisi-liste]').should('contain', 'O1').and('contain', '2 oyun');
  });
});
