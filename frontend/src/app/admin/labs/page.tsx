// /app/admin/labs/page.tsx

export default async function LabsPage() {
  // Fetch labs server-side
  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Lab Management</h1>
      <a href="/admin/labs/new" className="mb-4 inline-block bg-green-600 text-white px-4 py-2 rounded">Create New Lab</a>
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th>Name</th>
            <th>Technologies</th>
            <th>Duration</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {/* Map labs here */}
          <tr>
            <td>Linux Basics</td>
            <td>Bash, Linux</td>
            <td>60</td>
            <td>
              <a href="/admin/labs/1/edit" className="text-blue-600">Edit</a>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
