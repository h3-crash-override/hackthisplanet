// GET /api/uploads
// Vulnerabilities: A05 (directory listing — no auth required)
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).end()

  // Simulated directory listing - A05 (security misconfiguration)
  // In a traditional server this would be a real directory listing
  const files = [
    { name: 'invoice_alice_2024-01.pdf',    size: 48234,  modified: '2024-01-15T09:12:00Z', url: '/uploads/invoice_alice_2024-01.pdf' },
    { name: 'invoice_bob_2024-01.pdf',      size: 51102,  modified: '2024-01-16T11:34:00Z', url: '/uploads/invoice_bob_2024-01.pdf' },
    { name: 'export_users_2024-01-20.csv',  size: 8921,   modified: '2024-01-20T14:05:00Z', url: '/uploads/export_users_2024-01-20.csv' },
    { name: 'backup_db_2024-01-19.sql.gz',  size: 1048576,modified: '2024-01-19T03:00:00Z', url: '/uploads/backup_db_2024-01-19.sql.gz' },
    { name: 'product_import_template.xlsx', size: 12800,  modified: '2024-01-10T08:00:00Z', url: '/uploads/product_import_template.xlsx' },
    { name: 'admin_report_q4_2023.xlsx',    size: 98304,  modified: '2024-01-02T16:22:00Z', url: '/uploads/admin_report_q4_2023.xlsx' },
    { name: 'id_scan_charlie.jpg',          size: 204800, modified: '2024-01-08T10:45:00Z', url: '/uploads/id_scan_charlie.jpg' },
  ]

  res.setHeader('Content-Type', 'application/json')
  return res.status(200).json({
    path: '/uploads',
    total_files: files.length,
    files,
  })
}
