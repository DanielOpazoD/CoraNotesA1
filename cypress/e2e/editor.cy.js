describe('Editor shell', () => {
  it('carga la aplicación principal y muestra la barra superior', () => {
    cy.visit('/');
    cy.get('.topbar').should('be.visible');
    cy.contains('.topbar-btn', 'Editar').should('exist');
  });
});
