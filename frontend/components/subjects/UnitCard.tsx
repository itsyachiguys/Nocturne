import Link from "next/link";
import { Unit } from "@/types/unit";

interface Props {
  subjectId: string;
  unit: Unit;
}

export default function UnitCard({
  subjectId,
  unit,
}: Props) {
  return (
    <Link
      href={`/dashboard/subjects/${subjectId}/units/${unit.id}`}
      className="card block rounded-2xl p-5 transition hover:shadow-lg hover:-translate-y-1"
    >
      <div className="flex items-start justify-between">

        <div>
          <h3 className="text-lg font-semibold">
            {unit.title}
          </h3>

          <p className="mt-2 text-sm text-gray-500">
            {unit.description || "No description"}
          </p>
        </div>

        <div
          className="h-5 w-5 rounded-full"
          style={{
            backgroundColor: unit.color,
          }}
        />
      </div>

      <div className="mt-6">

        <div className="mb-2 flex justify-between text-sm">
          <span>Progress</span>
          <span>{unit.progress}%</span>
        </div>

        <div className="h-2 rounded-full bg-gray-200">

          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${unit.progress}%`,
              backgroundColor: unit.color,
            }}
          />

        </div>

      </div>
    </Link>
  );
}