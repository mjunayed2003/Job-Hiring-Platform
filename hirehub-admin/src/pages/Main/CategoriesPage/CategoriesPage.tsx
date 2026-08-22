import React, { useState } from "react";
import { FaChevronDown, FaCheck } from "react-icons/fa";
import { MdOutlineFileUpload, MdClose, MdAdd, MdEdit, MdDelete } from "react-icons/md";
import {
    useGetCategoriesQuery,
    useAddCategoryMutation,
    useUpdateCategoryMutation,
    useDeleteCategoryMutation
} from "../../../redux/features/categoriesApi/CategoriesApi";

const CategoriesContent = () => {
    // API Hooks
    const { data: categoriesData, isLoading } = useGetCategoriesQuery();
    const [addCategory, { isLoading: isAdding }] = useAddCategoryMutation();
    const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();
    const [deleteCategory] = useDeleteCategoryMutation();

    // States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("Job Seeker");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Form States
    const [editMode, setEditMode] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        image: null
    });


    const categories = categoriesData?.data || categoriesData || [];


    const handleOpenModal = (isEdit = false, item = null) => {
        setEditMode(isEdit);
        if (isEdit && item) {
            setCurrentId(item._id || item.id);
            setFormData({
                name: item.name || "",
                description: item.description || "",
                image: null
            });
        } else {
            setCurrentId(null);
            setFormData({ name: "", description: "", image: null });
        }
        setIsModalOpen(true);
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFormData({ ...formData, image: e.target.files[0] });
        }
    };

    const handleSubmit = async () => {
        try {
            const submitData = new FormData();
            submitData.append("name", formData.name);

            if (formData.description) {
                submitData.append("description", formData.description);
            }
            if (formData.image instanceof File) {
                submitData.append("image", formData.image);
            }

            if (editMode) {
                await updateCategory({ id: currentId, data: submitData }).unwrap();
            } else {
                await addCategory(submitData).unwrap();
            }

            setIsModalOpen(false);
            setFormData({ name: "", description: "", image: null });
        } catch (error) {
            console.error("Error saving category:", error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this category?")) {
            try {
                await deleteCategory(id).unwrap();
            } catch (error) {
                console.error("Error deleting category:", error);
            }
        }
    };

    const serverUrl = import.meta.env.VITE_SERVER_URL || "";

    return (
        <div className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-[700px] relative font-sans">
            {/* --- HEADER SECTION --- */}
            <div className="mb-8">
                <div className="flex justify-between items-center pb-1">
                    <h2 className="text-xl font-bold text-gray-800 mb-6">Categories</h2>
                    <div className="flex items-center gap-4 w-full md:w-auto relative">
                        <button
                            onClick={() => handleOpenModal(false)}
                            className="flex items-center gap-2 bg-[#43B948] hover:bg-green-600 text-white px-5 py-2.5 rounded-full font-medium shadow-md hover:shadow-lg transition duration-200"
                        >
                            <MdAdd size={20} />
                            <span>Add Category</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* --- GRID DISPLAY --- */}
            {isLoading ? (
                <div className="flex justify-center items-center h-40">Loading Categories...</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {categories.map((item, index) => {
                        const imageUrl = item.image
                            ? (item.image.startsWith("http") ? item.image : `${serverUrl}${item.image}`)
                            : "https://via.placeholder.com/150";

                        return (
                            <div key={item._id || item.id || index} className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-green-100 transition duration-300 cursor-pointer relative">

                                {/* Hover Overlay with Action Icons */}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30 flex items-center justify-center gap-4 backdrop-blur-sm">
                                    <button
                                        onClick={() => handleOpenModal(true, item)}
                                        className="p-3 bg-white text-blue-500 rounded-full hover:bg-blue-500 hover:text-white transition transform hover:scale-110 shadow-lg"
                                        title="Edit Category"
                                    >
                                        <MdEdit size={22} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item._id || item.id)}
                                        className="p-3 bg-white text-red-500 rounded-full hover:bg-red-500 hover:text-white transition transform hover:scale-110 shadow-lg"
                                        title="Delete Category"
                                    >
                                        <MdDelete size={22} />
                                    </button>
                                </div>

                                {/* Image Wrapper */}
                                <div className="h-44 w-full overflow-hidden relative">
                                    <img
                                        src={imageUrl}
                                        alt={item.name}
                                        className="w-full h-full object-cover transform group-hover:scale-110 transition duration-700 bg-gray-50"
                                    />
                                </div>

                                {/* Card Footer */}
                                <div className="p-4 text-center bg-white relative z-20">
                                    <p className="text-sm font-bold text-gray-700 group-hover:text-[#43B948] transition">
                                        {item.name}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1 truncate">{item.description || `${selectedCategory} Category`}</p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* --- MODAL / POPUP --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden transform scale-100 transition-all">
                        <div className="flex justify-between items-center px-8 py-6 border-b border-gray-100">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">
                                    {editMode ? "Update Category" : "Add New Category"}
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">Creating for: <span className="font-semibold text-green-600">{selectedCategory}</span></p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition"
                            >
                                <MdClose size={24} />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-3">Category Image</label>
                                <label className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-gray-50 hover:bg-green-50 hover:border-green-300 transition cursor-pointer group">
                                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                    <div className="w-14 h-14 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition duration-300">
                                        <MdOutlineFileUpload className="text-gray-400 group-hover:text-[#43B948] text-3xl transition" />
                                    </div>
                                    <p className="text-sm font-semibold text-gray-700">
                                        {formData.image ? formData.image.name : "Click to upload image"}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">SVG, PNG, JPG or GIF (max. 50MB)</p>
                                </label>
                            </div>

                            <div className="grid grid-cols-1 gap-5">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Category Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Graphic Design"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 text-sm focus:bg-white focus:border-[#43B948] focus:ring-2 focus:ring-green-500/20 outline-none transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Short Description</label>
                                    <input
                                        type="text"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        placeholder="Brief description of the category..."
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 text-sm focus:bg-white focus:border-[#43B948] focus:ring-2 focus:ring-green-500/20 outline-none transition"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 px-8 py-6 bg-gray-50 border-t border-gray-100">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-2.5 rounded-lg text-sm font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 hover:text-gray-800 transition shadow-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isAdding || isUpdating || !formData.name}
                                className="px-6 py-2.5 rounded-lg text-sm font-bold text-white bg-[#43B948] hover:bg-green-600 shadow-md shadow-green-200 transition transform active:scale-95 disabled:bg-gray-400"
                            >
                                {isAdding || isUpdating ? "Saving..." : "Save Category"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategoriesContent;