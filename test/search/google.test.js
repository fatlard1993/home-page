context('Listi - Items :: Create', () => {
	before(() => {
		cy.visit('#/items/new');
	});

	after(() => {
		//todo cleanup db doc
	});

	it('Creates a new item', () => {
		cy.contains('.content .label', /summary/i).children('.textInput').type('test-item');

		cy.get('.toolbar .iconButton.fa-save').click();

		cy.get('.view.list').should('be.visible');
	});
});