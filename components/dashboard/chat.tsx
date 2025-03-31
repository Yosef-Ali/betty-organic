"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Image as ImageIcon, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

import { StyleTemplateType } from "../style-template-selector"
import { ChatMessage } from "@/app/actions/productImage"

interface ChatProps {
  initialImage?: string
  onEditComplete?: (imageBase64: string) => void
  className?: string
  templateStyle?: StyleTemplateType  // Add template style prop
  productType?: string
}

export function ImageEditChat({ initialImage, onEditComplete, className, templateStyle, productType }: ChatProps) {
  const [message, setMessage] = useState("")
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Import the editImageWithChat function from actions.ts using dynamic import
  // to ensure it's only loaded on the client side
  const [editImageWithChat, setEditImageWithChat] = useState<any>(null)

  useEffect(() => {
    // Import the function dynamically
    import("@/app/actions/productImage").then((actions) => {
      setEditImageWithChat(() => actions.editImageWithChat)
    })
  }, [])

  // Auto-scroll to the latest message
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current
      scrollContainer.scrollTop = scrollContainer.scrollHeight
    }
  }, [chatHistory])

  useEffect(() => {
    // If an initial image is provided, add it to the chat history
    if (initialImage) {
      const initialMessages: ChatMessage[] = [
        {
          role: "model",
          content: "Here's your generated image. How would you like to edit it?",
          imageData: initialImage.replace(/^data:image\/[a-z]+;base64,/, "")
        }
      ]
      setChatHistory(initialMessages)
    }
  }, [initialImage])

  const handleSendMessage = async () => {
    if (!message.trim() || !editImageWithChat) return

    const userMessage: ChatMessage = {
      role: "user",
      content: message
    }

    // Add user message to chat
    setChatHistory((prev) => [...prev, userMessage])

    // Clear input
    setMessage("")

    // Focus textarea
    textareaRef.current?.focus()

    setIsLoading(true)

    try {
      // Get the latest image from chat history, if available
      const lastImageMessage = [...chatHistory].reverse().find(msg => msg.imageData)
      const imageBase64 = lastImageMessage?.imageData

      // Send message to the API with template style for consistent edits
      const response = await editImageWithChat({
        message,
        chatHistory,
        imageBase64,
        templateStyle, // Pass template style to maintain consistency
        productType
      })

      // Add response to chat
      setChatHistory((prev) => [...prev, response])

      // If there's an image and a callback, call it
      if (response.imageData && onEditComplete) {
        onEditComplete(response.imageData)
      }
    } catch (error: any) {
      // Add error message to chat
      setChatHistory((prev) => [
        ...prev,
        {
          role: "model",
          content: `Error: ${error.message || "Failed to process your edit request."}`
        }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {chatHistory.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
              <p>Start a conversation to edit your image</p>
              {(templateStyle || productType) && (
                <p className="text-xs mt-2">
                  Your edits will maintain the selected image style and product characteristics.
                </p>
              )}
            </div>
          ) : (
            chatHistory.map((chat, index) => (
              <div
                key={index}
                className={cn(
                  "flex flex-col max-w-[80%] rounded-lg p-4",
                  chat.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                {chat.imageData && (
                  <div className="mb-2">
                    <img
                      src={`data:image/png;base64,${chat.imageData}`}
                      alt="Generated image"
                      className="rounded-md max-h-64 w-auto object-contain"
                    />
                  </div>
                )}
                <p className={cn(
                  "text-sm",
                  chat.role === "user" ? "text-primary-foreground" : "text-foreground"
                )}>
                  {chat.content}
                </p>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t p-4">
        <div className="flex items-center gap-2">
          <Textarea
            ref={textareaRef}
            placeholder="Edit the image with your instructions..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[60px] flex-1"
            disabled={isLoading || !editImageWithChat}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() || isLoading || !editImageWithChat}
            size="icon"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
