"use client";
import { auth } from "@/lib/firebase";
import { useState } from "react";
import { ModuleService } from "@/services/module.service";

interface Props {
  subjectId: string;
  studentId: string;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateModuleModal({
  subjectId,
  studentId,
  onClose,
  onCreated,
}: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [order, setOrder] = useState(1);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();
  
    if (!name.trim()) return;
  
    if (!auth.currentUser) {
      alert("You must be logged in.");
      return;
    }
  
    try {
      setLoading(true);
  
      console.log("Authenticated User:", auth.currentUser.uid);
  
      console.log({
        authUid: auth.currentUser?.uid,
        studentId,
        subjectId,
        equal: auth.currentUser?.uid === studentId,
      });
  
      await ModuleService.create({
        studentId,
        subjectId,
        name,
        description,
        order,
      });
  
      onCreated();
      onClose();
    } catch (error: any) {
      console.error("Create Module Error:", error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

      <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-xl">

        <h2 className="mb-8 text-2xl font-bold">
          Create Module
        </h2>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >

          <div>
            <label className="mb-2 block text-sm font-medium">
              Module Name
            </label>

            <input
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Machine Learning Basics"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-violet-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Description
            </label>

            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description..."
              className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-violet-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Module Order
            </label>

            <input
              type="number"
              min={1}
              value={order}
              onChange={(e) => setOrder(Number(e.target.value))}
              className="w-32 rounded-xl border border-gray-300 px-4 py-3 focus:border-violet-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3">

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border px-5 py-3"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-violet-600 px-6 py-3 font-medium text-white disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Module"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}