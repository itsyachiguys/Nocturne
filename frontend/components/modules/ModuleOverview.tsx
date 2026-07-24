interface Props {
    title: string;
    description?: string;
  }
  
  export default function ModuleHeader({
    title,
    description,
  }: Props) {
    return (
      <div className="card p-6">
  
        <h1 className="text-3xl font-bold">
          {title}
        </h1>
  
        {description && (
          <p className="mt-2 text-muted-foreground">
            {description}
          </p>
        )}
  
      </div>
    );
  }