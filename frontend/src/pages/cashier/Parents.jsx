import ParentsManager from '../ParentsManager'
const CashierParents = () => (
  <ParentsManager
    apiPrefix="/api/cashier"
    title="Parents Directory"
    subtitle="View parent fee status and send payment reminders"
    isCashier={true}
  />
)
export default CashierParents
