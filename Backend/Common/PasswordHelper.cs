namespace RMS.Common;

/// <summary>
/// Password Helper using BCrypt for hashing
/// BCrypt is industry standard, more secure and easier to use than PBKDF2
/// </summary>
public static class PasswordHelper
{
    /// <summary>
    /// Hash password using BCrypt
    /// BCrypt automatically handles salt generation and storage
    /// </summary>
    /// <param name="password">Plain text password</param>
    /// <returns>BCrypt hashed password</returns>
    public static string HashPassword(string password)
    {
        // BCrypt with work factor 12 (2^12 iterations = 4096)
        // Higher work factor = more secure but slower
        // 12 is recommended for most applications
        return BCrypt.Net.BCrypt.HashPassword(password, workFactor: 12);
    }

    /// <summary>
    /// Verify password against BCrypt hash
    /// </summary>
    /// <param name="password">Plain text password to verify</param>
    /// <param name="passwordHash">BCrypt hash from database</param>
    /// <returns>True if password matches, false otherwise</returns>
    public static bool VerifyPassword(string password, string passwordHash)
    {
        try
        {
            return BCrypt.Net.BCrypt.Verify(password, passwordHash);
        }
        catch
        {
            return false;
        }
    }
}
