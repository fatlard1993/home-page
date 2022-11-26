context('Listi - Items :: Delete', () => {
	before(() => {
		cy.visit('#/list');

		// TODO:  inject db doc
	});

	after(() => {
		// TODO:  cleanup db doc
	});

	it('Deletes an item', () => {
		cy.contains('.list .item', /test-item/i).click({ force: true });

		cy.get('.view.itemEdit').should('be.visible');

		cy.get('.toolbar .iconButton.fa-trash-alt').click();

		cy.contains('.dialog .header', /attention/i).should('be.visible');
		cy.contains('.dialog .content', /delete/i).should('be.visible');

		cy.contains('.dialog .footer .button', /yes/i).click();

		cy.get('.view.list').should('be.visible');

		// cy.contains('.list .item', /test-item/i).should('not.exist');
	});
});
