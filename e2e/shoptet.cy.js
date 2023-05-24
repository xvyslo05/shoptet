import * as fixtures from "../../fixtures/classicFixtures.json"

describe('Checkout step 1', () => {
  beforeEach(() => {
    cy.visit(fixtures.url.product)

    cy.addToCart()

    cy.visit(fixtures.url.checkout)
  })

  it('Increase the quantity of a product via text input', () => {
    const quantity = 2
    cy.getByTestId('cartAmount')
      .clear()
      .type(quantity)
      .blur()

    cy.get(`[data-micro-sku="${fixtures.testProduct.code}"]`).within(() => {
      cy.get('input.amount').should('have.attr', 'value', quantity)

      cy.getByTestId('cartItemPrice').then(($span) => {
        const productUnitPrice = Number($span.text().substring(0, $span.text().indexOf(' ')))
        cy.getByTestId('cartPrice').should('contain', quantity * productUnitPrice)
      })
    })
  })

  it('Increase above max quantity via +/- buttons', () => {
    let quantity = 1

    cy.get(`[data-micro-sku="${fixtures.testProduct.code}"]`).within(() => {
      for(quantity; quantity <= fixtures.testProduct.maxAmount; quantity++) {
        cy.getByTestId('increase').click()
      }

      cy.getByTestId('cartItemPrice').then(($span) => {
        const productUnitPrice = Number($span.text().substring(0, $span.text().indexOf(' ')))
        cy.getByTestId('cartPrice').should('contain', fixtures.testProduct.maxAmount * productUnitPrice)
      })
    })
  })

  it('Remove one of the multiple products', () => {
    cy.visit('https://qa-classic.myshoptet.com/podobny-produkt/')

    let tableLength = 2

    cy.addToCart()
    cy.visit(fixtures.url.checkout)

    cy.get('.cart-table').find('tr').its('length').should('eq', tableLength)

    cy.get("[data-micro='cartItem']").last().within(() => {
      cy.get('button.remove-item')
        .trigger('mouseover')
        .click()
    })
    cy.intercept('**/deleteCartItem').as('deleteItem')
    cy.wait('@deleteItem')

    tableLength--

    cy.get('.cart-table').find('tr').its('length').should('eq', tableLength)
  })
})

describe('Apply coupon', () => {
  it('Apply coupon code', () => {
    const quantity = 50
    const discountPercentage = 0.5
    
    cy.visit('https://qa-classic.myshoptet.com/out-of-stock/')

    cy.getByTestId('cartAmount').clear().type(quantity)

    cy.addToCart()
    cy.visit(fixtures.url.checkout)

    cy.getByTestId('recapFullPrice').then(($span) => {
      const fullPrice = Number($span.text().replace(/[^\d\.]/g, ''))
      cy.intercept('**/addDiscountCoupon/**').as('addDiscountCoupon')
      cy.intercept('**/?orderingProcessActive=1').as('waitForCart')

      cy.getByTestId('txtDiscountCoupon').type(fixtures.couponCode + '{enter}')
      cy.wait('@addDiscountCoupon')
      cy.wait('@waitForCart')

      cy.getByTestId('recapFullPrice').then(($span) => {
        const discountedPrice = Number($span.text().replace(/[^\d\.]/g, ''))
        expect(discountedPrice).to.be.equal(fullPrice * discountPercentage)
      })
    })

  })
})