import AccessoryForm from "../AccessoryForm"

export default function EditAccessoryPage({ params }: { params: { id: string } }) {
  return <AccessoryForm mode="edit" id={params.id} />
}
