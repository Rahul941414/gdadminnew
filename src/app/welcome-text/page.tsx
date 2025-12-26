"use client";
import { useEffect, useState } from "react";
import { ArrowLeft, RefreshCw, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

const SystemTextPage = () => {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchSystemText();
  }, []);

  const fetchSystemText = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("https://backend.gdmatka.site/api/system-text");
      if (!response.ok) throw new Error("Failed to fetch system text");
      const data = await response.json();
      setContent(data.content || "");
    } catch (error) {
      console.error(error);
      alert("Error fetching system text.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch("https://backend.gdmatka.site/api/system-text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) throw new Error("Failed to update system text");

      alert("System text updated successfully!");
    } catch (error) {
      console.error(error);
      alert("Error updating system text.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
      <Card className="shadow-md">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0 pb-4">
          <div className="flex items-center space-x-2 md:space-x-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.back()}
              className="h-8 w-8 md:h-10 md:w-10"
            >
              <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
            <CardTitle className="text-lg md:text-2xl font-bold">System Text</CardTitle>
          </div>
          <Button
            variant="outline"
            onClick={fetchSystemText}
            disabled={isLoading}
            className="w-full sm:w-auto"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-48 md:h-64">
              <RefreshCw className="animate-spin text-gray-500 mr-2 h-5 w-5" />
              <p className="text-gray-500">Loading system text...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block font-medium text-gray-700">System Text Content</label>
                <Textarea
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter system-wide announcement or message here..."
                />
              </div>
              <Button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="mt-4 w-full sm:w-auto"
              >
                {isUpdating ? "Updating..." : "Update System Text"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* नया AddFundSlider कॉम्पोनेंट यहाँ जोड़ा गया है */}
      <AddFundSlider />
    </div>
  );
};

const AddFundSlider = () => {
  const [sliderTexts, setSliderTexts] = useState([]);
  const [newText, setNewText] = useState('');
  const [newLink, setNewLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchSliderTexts();
  }, []);

  const fetchSliderTexts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("https://backend.gdmatka.site/api/sliders/text");
      if (!response.ok) throw new Error("Failed to fetch slider texts");
      const data = await response.json();
      setSliderTexts(data);
    } catch (error) {
      console.error(error);
      alert("Error fetching slider texts.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddText = async () => {
    if (!newText.trim()) {
      alert("Slider text cannot be empty.");
      return;
    }

    setIsAdding(true);
    const token = localStorage.getItem("token");

    try {
      const payload = {
        text_content: newText,
        link_url: newLink || null, // अगर newLink खाली है, तो null भेजें
      };

      const response = await fetch("https://backend.gdmatka.site/api/sliders/text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Server error response:", errorData);
        throw new Error("Failed to add slider text: " + (errorData.error || "Unknown error"));
      }

      setNewText("");
      setNewLink("");
      fetchSliderTexts(); // अपडेटेड लिस्ट को फिर से लाएं
      alert("Slider text added successfully!");
    } catch (error) {
      console.error(error);
      alert("Error adding slider text. " + error.message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteText = async (id) => {
    if (!id) {
      alert("Error: Slider text ID is missing.");
      return;
    }
    if (!confirm("Are you sure you want to delete this slider text?")) {
      return;
    }

    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`https://backend.gdmatka.site/api/sliders/text/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to delete slider text");

      fetchSliderTexts(); // अपडेटेड लिस्ट को फिर से लाएं
      alert("Slider text deleted successfully!");
    } catch (error) {
      console.error(error);
      alert("Error deleting slider text.");
    }
  };

  const handleUpdateStatus = async (id, currentStatus) => {
    if (!id) {
      alert("Error: Slider text ID is missing.");
      return;
    }
    const token = localStorage.getItem("token");
    const newStatus = !currentStatus;

    try {
      const response = await fetch(`https://backend.gdmatka.site/api/sliders/text/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update status");

      fetchSliderTexts(); // अपडेटेड लिस्ट को फिर से लाएं
      alert("Slider status updated successfully!");
    } catch (error) {
      console.error(error);
      alert("Error updating slider status.");
    }
  };

  return (
    <Card className="shadow-md mt-8">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0 pb-4">
        <CardTitle className="text-lg md:text-2xl font-bold">Add Fund Slider</CardTitle>
        <Button
          variant="outline"
          onClick={fetchSliderTexts}
          disabled={isLoading}
          className="w-full sm:w-auto"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <Input
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="नया स्लाइडर टेक्स्ट डालें"
              className="flex-1"
              disabled={isAdding}
            />
            <Input
              value={newLink}
              onChange={(e) => setNewLink(e.target.value)}
              placeholder="वैकल्पिक लिंक URL"
              className="flex-1"
              disabled={isAdding}
            />
            <Button
              onClick={handleAddText}
              disabled={isAdding}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              {isAdding ? "Adding..." : "Add Text"}
            </Button>
          </div>
          {isLoading ? (
            <div className="flex justify-center items-center h-24">
              <RefreshCw className="animate-spin text-gray-500 mr-2 h-5 w-5" />
              <p className="text-gray-500">Loading slider texts...</p>
            </div>
          ) : (
            <div className="space-y-2 mt-4">
              {sliderTexts.length > 0 ? (
                sliderTexts.map((item) => (
                  <div key={item.id} className="flex items-center space-x-2 p-3 border rounded-md">
                    <span className="flex-1 text-sm md:text-base">{item.text_content}</span>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDeleteText(item.id)}
                      className="h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${item.id}`}
                        checked={item.is_active}
                        onCheckedChange={() => handleUpdateStatus(item.id, item.is_active)}
                      />
                      <label htmlFor={`status-${item.id}`} className="text-sm">Active</label>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500">कोई स्लाइडर टेक्स्ट नहीं मिला।</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemTextPage;


// "use client";
// import { useEffect, useState } from "react";
// import { ArrowLeft, RefreshCw } from "lucide-react";
// import { useRouter } from "next/navigation";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Textarea } from "@/components/ui/textarea";

// const SystemTextPage = () => {
//   const router = useRouter();
//   const [content, setContent] = useState("");
//   const [isLoading, setIsLoading] = useState(true);
//   const [isUpdating, setIsUpdating] = useState(false);

//   useEffect(() => {
//     fetchSystemText();
//   }, []);

//   const fetchSystemText = async () => {
//     setIsLoading(true);
//     try {
//       const response = await fetch("https://backend.gdmatka.site/api/system-text");
//       if (!response.ok) throw new Error("Failed to fetch system text");
//       const data = await response.json();
//       setContent(data.content || "");
//     } catch (error) {
//       console.error(error);
//       alert("Error fetching system text.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleUpdate = async () => {
//     setIsUpdating(true);
//     const token = localStorage.getItem("token");

//     try {
//       const response = await fetch("https://backend.gdmatka.site/api/system-text", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({ content }),
//       });

//       if (!response.ok) throw new Error("Failed to update system text");

//       alert("System text updated successfully!");
//     } catch (error) {
//       console.error(error);
//       alert("Error updating system text.");
//     } finally {
//       setIsUpdating(false);
//     }
//   };

//   return (
//     <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
//       <Card className="shadow-md">
//         <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0 pb-4">
//           <div className="flex items-center space-x-2 md:space-x-4">
//             <Button
//               variant="outline"
//               size="icon"
//               onClick={() => router.back()}
//               className="h-8 w-8 md:h-10 md:w-10"
//             >
//               <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
//             </Button>
//             <CardTitle className="text-lg md:text-2xl font-bold">System Text</CardTitle>
//           </div>
//           <Button
//             variant="outline"
//             onClick={fetchSystemText}
//             disabled={isLoading}
//             className="w-full sm:w-auto"
//             size="sm"
//           >
//             <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
//             Refresh
//           </Button>
//         </CardHeader>
//         <CardContent>
//           {isLoading ? (
//             <div className="flex justify-center items-center h-48 md:h-64">
//               <RefreshCw className="animate-spin text-gray-500 mr-2 h-5 w-5" />
//               <p className="text-gray-500">Loading system text...</p>
//             </div>
//           ) : (
//             <div className="space-y-4">
//               <div className="space-y-2">
//                 <label className="block font-medium text-gray-700">System Text Content</label>
//                 <Textarea
//                   rows={6}
//                   value={content}
//                   onChange={(e) => setContent(e.target.value)}
//                   placeholder="Enter system-wide announcement or message here..."
//                 />
//               </div>
//               <Button
//                 onClick={handleUpdate}
//                 disabled={isUpdating}
//                 className="mt-4 w-full sm:w-auto"
//               >
//                 {isUpdating ? "Updating..." : "Update System Text"}
//               </Button>
//             </div>
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

// export default SystemTextPage;
