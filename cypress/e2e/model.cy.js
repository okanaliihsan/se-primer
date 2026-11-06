// spec.md §13 — KA-7 ve KA-8: modelin oyunun davranışını değiştirmesi.
// Müdahale politikası, modelin gerçek olasılığına bağlı kalmasın diye eşik parametresiyle sınanır:
// ?esik=0 → her olasılık eşiği geçer, ?esik=1.01 → hiçbiri geçmez. Model yine gerçekten çalışır (rozet olasılığı gösterir).
// Yayındaki model eval kapısını geçemediği için GÖLGE moddadır (spec.md §15). KA-7/KA-8 politikanın kendisini sınar
// (?golge=kapali), KA-10 ise canlıdaki gölge davranışını (müdahale hesaplanır ama uygulanmaz).

const baslat = (esik, seviye = 'orta', golge = false) => {
  cy.visit(`/?esik=${esik}` + (golge ? '' : '&golge=kapali'));
  cy.get(`[data-cy=opt-level-${seviye}]`).click();
  cy.get('[data-cy=opt-role-devops]').click();
  cy.get('[data-cy=opt-goal-kriz]').click();
  cy.get('[data-cy=start]').click();
  cy.get('[data-cy=intro-next]').click();
};

describe('Uyum modeli', () => {
  it('KA-7 · Eşik geçilince tutor seçimden önce devreye girer, ipucu açılır, izde görünür', () => {
    baslat(0);
    cy.get('[data-cy=model-rozet]').should('contain', 'riskli seçim olasılığı').and('contain', 'tutor devreye girdi');
    cy.get('[data-cy=model-mudahale]').should('be.visible').and('contain', '?')
      .and('not.contain', 'Kritik birimleri belirle').and('not.contain', 'otomatik düzeltmesini bekle');
    cy.get('[data-cy=hint-panel]').should('be.visible');
    cy.oyna('AAA');
    cy.get('[data-cy=mudahale-iz-k1]').should('contain', 'tutor devreye girdi');
  });

  it('KA-8 · Eşik altında v1 akışı aynen sürer', () => {
    baslat(1.01);
    cy.get('[data-cy=model-rozet]').should('contain', 'müdahale yok');
    cy.get('[data-cy=model-mudahale]').should('not.exist');
    cy.get('[data-cy=hint-panel]').should('not.exist');
    cy.get('[data-cy=hint-toggle]').should('be.visible');
  });

  it('KA-10 · Gölge mod: model müdahale ederdi ama oyun değişmez', () => {
    baslat(0, 'orta', true);
    cy.get('[data-cy=model-rozet]').should('contain', 'gölge mod').and('contain', 'EDERDİ').and('contain', 'oyunu değiştirmiyor');
    cy.get('[data-cy=model-mudahale]').should('not.exist');
    cy.get('[data-cy=hint-panel]').should('not.exist');
    cy.oyna('AAA');
    cy.get('[data-cy=golge-iz-k1]').should('contain', 'gölge');
    cy.get('[data-cy=mudahale-iz-k1]').should('not.exist');
  });

  it('Model yüklenemezse oyun kural tabanlı akışla oynanabilir kalır', () => {
    cy.visit('/?model=kapali');
    cy.get('[data-cy=opt-level-yeni]').click();
    cy.get('[data-cy=opt-role-qa]').click();
    cy.get('[data-cy=opt-goal-kvkk]').click();
    cy.get('[data-cy=start]').click();
    cy.get('[data-cy=intro-next]').click();
    cy.get('[data-cy=model-rozet]').should('contain', 'kullanılamıyor');
    cy.oyna('AAA');
    cy.get('[data-cy=ending]').should('contain', 'SON A');
  });
});
