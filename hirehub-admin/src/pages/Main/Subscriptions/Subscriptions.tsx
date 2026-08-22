import React, { useState } from "react";
import { FaCrown } from "react-icons/fa";
import { FiPlus, FiMinus, FiTrash2 } from "react-icons/fi";
import {
  useGetPlansQuery,
  useCreatePlanMutation,
  useUpdatePlanMutation,
  useDeletePlanMutation,
} from "../../../redux/features/subscriptionsApi/subscriptionsApi.js";

const  Subscriptions = () => {
  // API Hooks
  const { data: plansData, isLoading } = useGetPlansQuery();
  const[createPlan, { isLoading: isCreating }] = useCreatePlanMutation();
  const[updatePlan, { isLoading: isUpdating }] = useUpdatePlanMutation();
  const [deletePlan] = useDeletePlanMutation();

  const plans = plansData?.data || [];

  // States for Modal and Form
  const[isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    duration: "",
    slotsAvailable: "",
    price: "",
    features: [""],
  });

  // Modal Handlers
  const handleOpenModal = (isEdit = false, plan = null) => {
    setEditMode(isEdit);
    if (isEdit && plan) {
      setCurrentId(plan.id);
      setFormData({
        name: plan.name || "",
        duration: plan.duration || "",
        slotsAvailable: plan.slotsAvailable || "",
        price: plan.price || "",
        features: plan.features?.length > 0 ? plan.features : [""],
      });
    } else {
      setCurrentId(null);
      setFormData({
        name: "",
        duration: "",
        slotsAvailable: "",
        price: "",
        features: [""],
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  // Input Handlers
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFeatureChange = (index, value) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData({ ...formData, features: newFeatures });
  };

  const addFeatureInput = () => {
    setFormData({ ...formData, features:[...formData.features, ""] });
  };

  const removeFeatureInput = (index) => {
    const newFeatures = formData.features.filter((_, i) => i !== index);
    setFormData({ ...formData, features: newFeatures });
  };

  // Submit Handler
  const handleSubmit = async () => {
    try {
      // Data formatting for backend
      const payload = {
        name: formData.name,
        duration: Number(formData.duration),
        slotsAvailable: Number(formData.slotsAvailable),
        price: Number(formData.price),
        features: formData.features.filter((f) => f.trim() !== ""), // Empty string বাদ দেওয়া হচ্ছে
      };

      if (editMode) {
        await updatePlan({ id: currentId, data: payload }).unwrap();
      } else {
        await createPlan(payload).unwrap();
      }
      handleCloseModal();
    } catch (error) {
      console.error("Error saving plan:", error);
      alert("Failed to save plan. Please check the console.");
    }
  };

  // Delete Handler
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this plan?")) {
      try {
        await deletePlan(id).unwrap();
      } catch (error) {
        console.error("Error deleting plan:", error);
      }
    }
  };

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-8 min-h-[700px] font-sans">
      
      {/* --- HEADER --- */}
      <div className="flex justify-between items-center mb-6 border-b border-dashed border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-800">Subscriptions</h2>
        <button
          onClick={() => handleOpenModal(false)}
          className="bg-[#43B948] hover:bg-green-600 text-white px-6 py-2.5 rounded-full font-medium shadow-sm transition"
        >
          Create Subscription Plan
        </button>
      </div>

      {/* --- PLANS GRID --- */}
      {isLoading ? (
        <div className="flex justify-center items-center h-40">Loading plans...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div key={plan.id} className="bg-[#fcfdfc] border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition overflow-hidden relative group">
                
              {/* Delete Icon (Hover to view) */}
              <button 
                  onClick={() => handleDelete(plan.id)}
                  className="absolute top-3 right-3 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition z-10"
                  title="Delete Plan"
              >
                  <FiTrash2 size={20} />
              </button>

              {/* Card Header */}
              <div className="bg-[#edf7ed] py-3 flex items-center justify-center gap-2 text-[#43B948] font-bold uppercase tracking-wider text-sm">
                <FaCrown />
                {plan.name}
              </div>

              {/* Progress / Duration Box */}
              <div className="bg-white border border-gray-100 rounded-xl p-4 m-4 shadow-sm flex items-center gap-4">
                <div className="bg-[#43B948] text-white rounded-full min-w-[40px] h-10 flex items-center justify-center text-xs font-bold shadow-sm">
                  100%
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-gray-800 mb-1.5">{plan.duration} Days Plan</div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#43B948] w-full rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Plan Details */}
              <div className="px-6 py-2 space-y-2 text-[13px] text-gray-700">
                <p><span className="text-[#43B948] font-medium w-28 inline-block">Plan Name:</span> <span className="font-semibold text-black">{plan.name}</span></p>
                <p><span className="text-[#43B948] font-medium w-28 inline-block">Price:</span> <span className="font-semibold text-black">JMD {plan.price}</span></p>
                <p><span className="text-[#43B948] font-medium w-28 inline-block">Duration:</span> <span className="font-semibold text-black">{plan.duration} Days</span></p>
                <p><span className="text-[#43B948] font-medium w-28 inline-block">Slots Available:</span> <span className="font-semibold text-black">{plan.slotsAvailable} Rotational Slot</span></p>
                
                <div className="pt-1">
                  <span className="text-[#43B948] font-medium block mb-1">Features:</span>
                  <ul className="list-disc pl-5 space-y-1 font-medium text-black">
                    {plan.features?.map((feature, idx) => (
                      <li key={idx}>{feature}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Footer Button */}
              <div className="p-5 mt-2">
                <button
                  onClick={() => handleOpenModal(true, plan)}
                  className="w-full bg-[#43B948] hover:bg-green-600 text-white font-medium py-2.5 rounded-full flex items-center justify-center gap-2 transition shadow-sm"
                >
                  <FaCrown /> Edit Plan
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- CREATE / EDIT MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden animate-in fade-in duration-200">
            
            <div className="p-8">
              {/* Modal Header */}
              <h2 className="text-xl font-bold text-gray-800 border-b border-dashed border-gray-200 pb-4 mb-6">
                {editMode ? "Edit Subscription" : "Create Subscription"}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                
                {/* Left Column - Basic Fields */}
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1.5">Plan Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. BASIC HIRE"
                      className="w-full bg-[#f8f9fa] border-none rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-green-500/20 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1.5">Plan Duration (Days)</label>
                    <input
                      type="number"
                      name="duration"
                      value={formData.duration}
                      onChange={handleChange}
                      placeholder="e.g. 30"
                      className="w-full bg-[#f8f9fa] border-none rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-green-500/20 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1.5">Plan Slot Available</label>
                    <input
                      type="number"
                      name="slotsAvailable"
                      value={formData.slotsAvailable}
                      onChange={handleChange}
                      placeholder="e.g. 1"
                      className="w-full bg-[#f8f9fa] border-none rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-green-500/20 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1.5">Plan Price ($)</label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="e.g. 282"
                      className="w-full bg-[#f8f9fa] border-none rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-green-500/20 outline-none transition"
                    />
                  </div>
                </div>

                {/* Right Column - Features */}
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">Features</label>
                  <div className="space-y-3">
                    {formData.features.map((feature, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={feature}
                          onChange={(e) => handleFeatureChange(index, e.target.value)}
                          placeholder="Add a feature..."
                          className="flex-1 bg-[#f8f9fa] border-none rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-green-500/20 outline-none transition"
                        />
                        <button
                          type="button"
                          onClick={() => index === formData.features.length - 1 ? addFeatureInput() : removeFeatureInput(index)}
                          className="p-3 text-gray-500 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
                        >
                          {index === formData.features.length - 1 ? <FiPlus /> : <FiMinus />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Footer Buttons */}
              <div className="mt-10 flex justify-end gap-3">
                <button
                  onClick={handleCloseModal}
                  className="px-6 py-2.5 rounded-full text-sm font-medium text-gray-600 bg-[#eef0f3] hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isCreating || isUpdating}
                  className="px-6 py-2.5 rounded-full text-sm font-medium text-white bg-[#43B948] hover:bg-green-600 transition shadow-sm disabled:opacity-50"
                >
                  {isCreating || isUpdating ? "Saving..." : "Save & Continue"}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subscriptions;