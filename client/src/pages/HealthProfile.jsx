import React, { useEffect, useState } from "react";

function HealthProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});

  const token = localStorage.getItem("token");

  const fetchProfile = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/health", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (data.profile) {
        setProfile(data.profile);
        setForm({
            ...data.profile,
            emergencyContactName: data.profile.emergencyContact?.name || "",
            emergencyContactPhone: data.profile.emergencyContact?.phone || "",
          });
      } else {
        setProfile(null);
        setForm({});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
        ...form,
        emergencyContact: {
          name: form.emergencyContactName || "",
          phone: form.emergencyContactPhone || "",
        },
      };
    
    try {
      const res = await fetch("http://localhost:8080/api/health", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.profile) {
        setProfile(data.profile);
        setForm({
          ...data.profile,
          emergencyContactName: data.profile.emergencyContact?.name || "",
          emergencyContactPhone: data.profile.emergencyContact?.phone || "",
        });
        setEditMode(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) return <div className="text-center mt-10 text-white text-lg">Loading your health profile...</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-gray-900 text-white rounded-xl shadow-xl mt-8">
      <h1 className="text-3xl font-extrabold mb-6 text-center text-blue-400">Health Profile</h1>

      {!editMode ? (
        profile ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoCard label="Age" value={profile.age} />
              <InfoCard label="Gender" value={profile.gender} />
              <InfoCard label="Height" value={`${profile.height} cm`} />
              <InfoCard label="Weight" value={`${profile.weight} kg`} />
              <InfoCard label="Blood Group" value={profile.bloodGroup} />
              <InfoCard label="Medical Conditions" value={profile.medicalConditions?.join(", ") || "-"} />
              <InfoCard label="Allergies" value={profile.allergies?.join(", ") || "-"} />
              <InfoCard label="Medications" value={profile.medications?.join(", ") || "-"} />
              <InfoCard
                label="Emergency Contact"
                value={profile.emergencyContact ? `${profile.emergencyContact.name} - ${profile.emergencyContact.phone}` : "-"}
              />
              <InfoCard
                label="Last Checkup"
                value={profile.lastCheckup ? new Date(profile.lastCheckup).toLocaleDateString() : "-"}
              />
            </div>
            <div className="flex justify-center mt-6">
              <button
                onClick={() => setEditMode(true)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors duration-300"
              >
                Edit Profile
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <p className="text-gray-300 text-lg">No profile found. Please create one.</p>
            <button
              onClick={() => setEditMode(true)}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors duration-300"
            >
              Create Profile
            </button>
          </div>
        )
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="Age" name="age" value={form.age || ""} onChange={handleChange} type="number" />
            <InputField label="Gender" name="gender" value={form.gender || ""} onChange={handleChange} type="text" />
            <InputField label="Height (cm)" name="height" value={form.height || ""} onChange={handleChange} type="number" />
            <InputField label="Weight (kg)" name="weight" value={form.weight || ""} onChange={handleChange} type="number" />
            <InputField label="Blood Group" name="bloodGroup" value={form.bloodGroup || ""} onChange={handleChange} type="text" />
            <InputField
              label="Medical Conditions"
              name="medicalConditions"
              value={form.medicalConditions?.join(", ") || ""}
              onChange={(e) => setForm({ ...form, medicalConditions: e.target.value.split(",") })}
            />
            <InputField
              label="Allergies"
              name="allergies"
              value={form.allergies?.join(", ") || ""}
              onChange={(e) => setForm({ ...form, allergies: e.target.value.split(",") })}
            />
            <InputField
              label="Medications"
              name="medications"
              value={form.medications?.join(", ") || ""}
              onChange={(e) => setForm({ ...form, medications: e.target.value.split(",") })}
            />
            <InputField
              label="Emergency Contact Name"
              name="emergencyContactName"
              value={form.emergencyContact?.name || ""}
              onChange={(e) =>
                setForm({ ...form, emergencyContact: { ...form.emergencyContact, name: e.target.value } })
              }
            />
            <InputField
              label="Emergency Contact Phone"
              name="emergencyContactPhone"
              value={form.emergencyContact?.phone || ""}
              onChange={(e) =>
                setForm({ ...form, emergencyContact: { ...form.emergencyContact, phone: e.target.value } })
              }
            />
          </div>
          <div className="flex justify-center space-x-4 mt-6">
            <button
              type="submit"
              className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors duration-300"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditMode(false)}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg font-semibold transition-colors duration-300"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default HealthProfile;

// -----------------------
// Helper component for consistent display
function InfoCard({ label, value }) {
  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-sm flex flex-col">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className="text-white font-semibold text-lg">{value || "-"}</span>
    </div>
  );
}

// -----------------------
// Reusable input component
function InputField({ label, name, value, onChange, type = "text" }) {
  return (
    <div className="flex flex-col">
      <label className="text-gray-400 mb-1">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-blue-500 focus:outline-none"
      />
    </div>
  );
}