context('Listi - Items :: Read', () => {
	before(() => {
		//todo inject db doc
	});

	beforeEach(() => {
		cy.visit('#/list');
	});

	after(() => {
		//todo cleanup db doc
	});

	it('Opens the New Item View via URL', () => {
		cy.get('.view.list').should('be.visible');

		cy.visit('#/items/new');

		cy.get('.view.itemEdit').should('be.visible');
	});

	it('Opens the New Item View via Toolbar', () => {
		cy.get('.iconButton.fa-plus').click();

		cy.contains('.dialog .header', /create/i).should('be.visible');

		cy.contains('.dialog .footer .button', /item/i).click();

		cy.get('.view.itemEdit').should('be.visible');
	});

	it('Opens the Edit Item View via the Item View', () => {
		cy.contains('.list .item', /test-item/i).click();

		cy.get('.view.itemEdit').should('be.visible');

		cy.contains('.content .label', /summary/i).children('.textInput').should('have.value', 'test-item');

		// cy.contains('.tag:not(.addTag)', /test-tag/i).should('be.visible');
	});
});