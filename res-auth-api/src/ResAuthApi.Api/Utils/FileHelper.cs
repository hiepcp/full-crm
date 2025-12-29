namespace ResAuthApi.Api.Utils
{
    public static class FileHelper
    {
        public static async Task<string> SaveUserAvatarAsync(string email, byte[] avatarBytes)
        {
            if (avatarBytes == null || avatarBytes.Length == 0)
                throw new ArgumentException("Avatar data is empty");

            // Tạo thư mục lưu avatar nếu chưa tồn tại
            var avatarFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "avatars");
            if (!Directory.Exists(avatarFolder))
                Directory.CreateDirectory(avatarFolder);

            // Tạo tên file từ email (loại bỏ ký tự đặc biệt)
            var safeEmail = email.Replace("@", "_at_").Replace(".", "_");
            var fileName = $"{safeEmail}.jpg";
            var filePath = Path.Combine(avatarFolder, fileName);

            // Ghi file vào hệ thống
            await File.WriteAllBytesAsync(filePath, avatarBytes);

            // Trả về đường dẫn tương đối để dùng trong frontend
            return $"/avatars/{fileName}";
        }
    }
}
