interface Props {
    params: Promise<{
      subjectId: string;
      unitId: string;
    }>;
  }
  
  export default async function UnitPage({
    params,
  }: Props) {
    const { unitId } = await params;
  
    return (
      <div className="space-y-4">
  
        <h1 className="text-3xl font-bold">
          Unit
        </h1>
  
        <p className="text-gray-500">
          Unit ID:
        </p>
  
        <code className="rounded bg-gray-100 px-3 py-2">
          {unitId}
        </code>
  
      </div>
    );
  }