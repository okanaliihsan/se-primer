// KA-9 · Diferansiyel test (parite): aynı model.onnx, iki farklı tüketici.
// Test kahini: tests/parite.py (Python + onnxruntime) → tests/parite.json
// Uygulama: ?parite=1 ekranı aynı 5 girdiyi tarayıcıdaki çıkarım motoruyla çalıştırır.
// Her vakada |p_uygulama − p_python| < 1e-4 olmalı.
const TOLERANS = 1e-4;

describe('Diferansiyel test (parite)', () => {
  it('5 referans girdide uygulama ile Python aynı olasılığı verir', () => {
    cy.visit('/?parite=1');
    cy.get('[data-cy=motor]').should('not.contain', 'yükleniyor').and('not.contain', 'hata').and('not.contain', 'yok');
    cy.get('[data-cy=parite-vaka]').should('have.length', 5);
    cy.farklarKucuk(TOLERANS);
  });
});
