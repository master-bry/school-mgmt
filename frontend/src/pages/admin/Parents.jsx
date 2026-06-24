import ParentsManager from '../ParentsManager'
const AdminParents = () => (
  <ParentsManager
    apiPrefix="/api/admin"
    title="Parents Directory"
    subtitle="View all parents with children, fee status, and communication history"
  />
)
export default AdminParents
