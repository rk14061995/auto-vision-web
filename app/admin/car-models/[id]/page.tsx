import CarModelForm from "../CarModelForm"

export default function EditCarModelPage({ params }: { params: { id: string } }) {
  return <CarModelForm mode="edit" id={params.id} />
}
