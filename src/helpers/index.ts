export function formatCurrency(quantity : number) {
    return new Intl.NumberFormat('th-TH', {
        style: 'currency', currency: 'THB'
    }).format(quantity)
}