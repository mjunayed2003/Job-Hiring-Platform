// src/pages/admin/support/SupportPage.tsx  (React/Vite)

import { useState } from "react";
import { FiMail, FiPhone, FiMessageSquare, FiSearch, FiX, FiEye } from "react-icons/fi";
import { useGetSupportsQuery } from "../../../redux/features/SupportApi/SupportApi";

const DetailsModal = ({ item, onClose }: { item: any; onClose: () => void }) => (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
      <div className="flex items-center justify-between p-5 border-b border-gray-100">
        <h3 className="font-bold text-gray-800">Support Details</h3>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
          <FiX size={18} />
        </button>
      </div>

      <div className="p-5 space-y-4">
        <div>
          <p className="text-xs text-gray-400 font-medium mb-1">Title</p>
          <p className="text-sm font-semibold text-gray-800">{item.title}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-400 font-medium mb-1 flex items-center gap-1">
              <FiMail size={11} /> Email
            </p>
            <p className="text-sm text-gray-700 break-all">{item.email}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium mb-1 flex items-center gap-1">
              <FiPhone size={11} /> Phone
            </p>
            <p className="text-sm text-gray-700">{item.phone}</p>
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-400 font-medium mb-2 flex items-center gap-1">
            <FiMessageSquare size={11} /> Message
          </p>
          <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 leading-relaxed border border-gray-100">
            {item.message}
          </div>
        </div>

        <p className="text-xs text-gray-400 text-right">
          {new Date(item.createdAt).toLocaleString("en-GB")}
        </p>
      </div>
    </div>
  </div>
);

const AdminSupportPage = () => {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const limit = 10;

  const { data, isLoading, isFetching } = useGetSupportsQuery({ page, limit });

  const supports = data?.data ?? [];
  const totalPages = data?.meta?.totalPages ?? 1;
  const total = data?.meta?.total ?? 0;

  // Client-side search (title/email)
  const filtered = searchInput
    ? supports.filter(
        (s: any) =>
          s.title.toLowerCase().includes(searchInput.toLowerCase()) ||
          s.email.toLowerCase().includes(searchInput.toLowerCase())
      )
    : supports;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full min-h-[700px] flex flex-col p-6 gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dashed border-gray-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Support Requests</h2>
          <p className="text-xs text-gray-400 mt-0.5">{total} total requests</p>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
          <FiSearch size={14} className="text-gray-400" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search title or email..."
            className="bg-transparent text-sm outline-none w-48 text-gray-700 placeholder:text-gray-400"
          />
          {searchInput && (
            <button onClick={() => setSearchInput("")}>
              <FiX size={13} className="text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead className="text-gray-400 text-xs border-b border-gray-100">
            <tr>
              <th className="py-3 px-4 font-medium">#</th>
              <th className="py-3 px-4 font-medium">Title</th>
              <th className="py-3 px-4 font-medium">Email</th>
              <th className="py-3 px-4 font-medium">Phone</th>
              <th className="py-3 px-4 font-medium">Message</th>
              <th className="py-3 px-4 font-medium">Date</th>
              <th className="py-3 px-4 font-medium text-center">Details</th>
            </tr>
          </thead>
          <tbody className="text-sm text-gray-700 divide-y divide-gray-50">
            {isLoading || isFetching ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="py-4 px-4">
                      <div className="h-4 bg-gray-100 rounded w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-gray-400 text-sm">
                  No support requests found.
                </td>
              </tr>
            ) : (
              filtered.map((row: any, i: number) => (
                <tr key={row.id} className="hover:bg-gray-50/60 transition">
                  <td className="py-3.5 px-4 text-gray-400 text-xs">
                    {(page - 1) * limit + i + 1}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-gray-800 max-w-[160px] truncate">
                    {row.title}
                  </td>
                  <td className="py-3.5 px-4 text-gray-500 text-xs">{row.email}</td>
                  <td className="py-3.5 px-4 text-gray-500 text-xs">{row.phone}</td>
                  <td className="py-3.5 px-4 text-gray-500 text-xs max-w-[200px] truncate">
                    {row.message}
                  </td>
                  <td className="py-3.5 px-4 text-gray-400 text-xs whitespace-nowrap">
                    {new Date(row.createdAt).toLocaleDateString("en-GB")}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => setSelected(row)}
                      className="inline-flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-1.5 rounded-full text-xs font-semibold transition"
                    >
                      <FiEye size={12} /> View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pt-4 border-t border-gray-100 flex items-center justify-center gap-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-2 px-5 py-2 bg-[#E7F8EE] text-gray-600 text-sm font-medium rounded-lg hover:bg-green-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            ← Previous
          </button>

          <div className="flex gap-3 text-sm font-medium">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`w-8 h-8 rounded-lg transition ${
                  page === n
                    ? "bg-[#43B948] text-white font-bold shadow-sm"
                    : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                }`}
              >
                {n < 10 ? `0${n}` : n}
              </button>
            ))}
          </div>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-2 px-5 py-2 bg-[#43B948] text-white text-sm font-medium rounded-lg hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
          >
            Next Page →
          </button>
        </div>
      )}

      {/* Details Modal */}
      {selected && <DetailsModal item={selected} onClose={() => setSelected(null)} />}
    </div>
  );
};

export default AdminSupportPage;