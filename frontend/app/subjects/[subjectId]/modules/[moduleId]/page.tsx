interface Props {
    params: Promise<{
      subjectId: string;
      moduleId: string;
    }>;
  }
  
  export default async function ModulePage({
    params,
  }: Props) {
    const { moduleId } = await params;
  
    return (
      <div className="space-y-4">
  
        <h1 className="text-3xl font-bold">
          Module
        </h1>
  
        <p className="text-gray-500">
          Module ID:
        </p>
  
        <code className="rounded bg-gray-100 px-3 py-2">
          {moduleId}
        </code>
  
      </div>
    );
  }